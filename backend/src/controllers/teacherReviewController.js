const { Op } = require('sequelize');
const { 
    ExamAttempt, 
    AttemptAnswer, 
    Question, 
    User, 
    Exam, 
    AIScoringRubric,
    sequelize 
} = require('../models');

class TeacherReviewController {
    // Get all submissions that need review (AI-flagged or manual review requested)
    static async getPendingReviews(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const { skill_id, exam_id, priority } = req.query;

            let whereClause = {
                status: 'completed'
            };

            // Add filters
            if (skill_id) {
                whereClause['$answers.question.skill_id$'] = skill_id;
            }
            if (exam_id) {
                whereClause.exam_id = exam_id;
            }

            const { count, rows: pendingReviews } = await ExamAttempt.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'full_name', 'email']
                    },
                    {
                        model: Exam,
                        as: 'exam',
                        attributes: ['id', 'title', 'description']
                    },
                    {
                        model: AttemptAnswer,
                        as: 'answers',
                        where: { needs_manual_review: true },
                        include: [{
                            model: Question,
                            as: 'question',
                            attributes: ['id', 'question_text', 'skill_id']
                        }],
                        required: true
                    }
                ],
                distinct: true,
                limit,
                offset,
                order: [['created_at', 'DESC']]
            });

            // Calculate priority scores
            const reviewsWithPriority = pendingReviews.map(attempt => {
                let priorityScore = 0;
                const daysOld = Math.floor((new Date() - new Date(attempt.created_at)) / (1000 * 60 * 60 * 24));
                
                // Age factor
                priorityScore += daysOld * 10;
                
                // Count of flagged answers
                priorityScore += attempt.answers.length * 5;
                
                // Speaking/Writing questions get higher priority
                const hasSpeakingWriting = attempt.answers.some(answer => 
                    [3, 4].includes(answer.question ? answer.question.skill_id : null) // Writing = 3, Speaking = 4
                );
                if (hasSpeakingWriting) priorityScore += 50;

                return {
                    ...attempt.toJSON(),
                    priority_score: priorityScore,
                    days_pending: daysOld,
                    flagged_answers_count: attempt.answers.length
                };
            });

            // Sort by priority if requested
            if (priority === 'high') {
                reviewsWithPriority.sort((a, b) => b.priority_score - a.priority_score);
            }

            res.json({
                success: true,
                data: {
                    pending: reviewsWithPriority,
                    pagination: {
                        page,
                        limit,
                        total: count,
                        pages: Math.ceil(count / limit)
                    },
                    stats: {
                        total_pending: count,
                        high_priority: reviewsWithPriority.filter(r => r.priority_score > 100).length
                    }
                }
            });

        } catch (error) {
            console.error('Get pending reviews error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve pending reviews',
                error: error.message
            });
        }
    }

    // Get detailed review data for a specific submission
    static async getReviewDetails(req, res) {
        try {
            const { attemptId } = req.params;

            const attempt = await ExamAttempt.findOne({
                where: { id: attemptId },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'full_name', 'email']
                    },
                    {
                        model: Exam,
                        as: 'exam',
                        attributes: ['id', 'title', 'description']
                    },
                    {
                        model: AttemptAnswer,
                        as: 'answers',
                        include: [
                            {
                                model: Question,
                                as: 'question'
                            }
                        ]
                    }
                ]
            });

            if (!attempt) {
                return res.status(404).json({
                    success: false,
                    message: 'Exam attempt not found'
                });
            }

            // Group answers by skill
            const answers = attempt.answers || [];
            const answersBySkill = answers.reduce((acc, answer) => {
                const skillId = answer.question ? answer.question.skill_id : null;
                if (skillId) {
                    if (!acc[skillId]) {
                        acc[skillId] = [];
                    }
                    acc[skillId].push(answer);
                }
                return acc;
            }, {});

            res.json({
                success: true,
                data: {
                    attempt_info: {
                        id: attempt.id,
                        exam: attempt.Exam,
                        student: attempt.User,
                        started_at: attempt.started_at,
                        submitted_at: attempt.submitted_at,
                        total_score: attempt.total_score,
                        max_score: attempt.max_score,
                        time_taken: attempt.time_taken
                    },
                    answers_by_skill: answersBySkill,
                    flagged_answers: answers.filter(a => a.needs_manual_review),
                    review_summary: {
                        total_answers: answers.length,
                        flagged_count: answers.filter(a => a.needs_manual_review).length,
                        completed_score: answers.filter(a => a.score !== null).length
                    }
                }
            });

        } catch (error) {
            console.error('Get review details error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve review details',
                error: error.message
            });
        }
    }

    // Submit manual review for an answer
    static async submitManualReview(req, res) {
        try {
            const { answerId } = req.params;
            const { score, feedback, is_correct } = req.body;
            const teacherId = req.user.id;

            // Validate input
            if (score === undefined || feedback === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Score and feedback are required'
                });
            }

            const answer = await AttemptAnswer.findOne({
                where: { id: answerId },
                include: [{
                    model: Question,
                    as: 'question'
                }]
            });

            if (!answer) {
                return res.status(404).json({
                    success: false,
                    message: 'Answer not found'
                });
            }

            // Validate score range (max score from question points)
            const maxScore = answer.question ? (answer.question.points || 100) : 100;
            if (score < 0 || score > maxScore) {
                return res.status(400).json({
                    success: false,
                    message: `Score must be between 0 and ${maxScore}`
                });
            }

            // Update answer with manual review
            await answer.update({
                score: score,
                is_correct: is_correct !== undefined ? is_correct : (score > 0),
                ai_feedback: feedback,
                needs_manual_review: false,
                manual_review_by: teacherId,
                manual_review_at: new Date()
            });

            // Recalculate exam attempt total score
            const attempt = await ExamAttempt.findByPk(answer.attempt_id);
            if (attempt) {
                await TeacherReviewController.recalculateAttemptScore(answer.attempt_id);
            }

            res.json({
                success: true,
                data: {
                    answer_id: answerId,
                    new_score: score,
                    feedback: feedback,
                    reviewed_by: teacherId,
                    reviewed_at: new Date()
                },
                message: 'Manual review submitted successfully'
            });

        } catch (error) {
            console.error('Submit manual review error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit manual review',
                error: error.message
            });
        }
    }

    // Batch review multiple answers
    static async batchReview(req, res) {
        try {
            const { reviews } = req.body; // Array of {answerId, score, feedback, is_correct}
            const teacherId = req.user.id;

            if (!Array.isArray(reviews) || reviews.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Reviews array is required'
                });
            }

            const results = [];
            const attemptIds = new Set();

            for (const review of reviews) {
                try {
                    const { answerId, score, feedback, is_correct } = review;

                    const answer = await AttemptAnswer.findOne({
                        where: { id: answerId },
                        include: [{
                            model: Question,
                            as: 'question'
                        }]
                    });

                    if (!answer) {
                        results.push({
                            answerId,
                            success: false,
                            error: 'Answer not found'
                        });
                        continue;
                    }

                    const maxScore = answer.question ? (answer.question.points || 100) : 100;
                    if (score < 0 || score > maxScore) {
                        results.push({
                            answerId,
                            success: false,
                            error: `Score must be between 0 and ${maxScore}`
                        });
                        continue;
                    }

                    await answer.update({
                        score: score,
                        is_correct: is_correct !== undefined ? is_correct : (score > 0),
                        ai_feedback: feedback || '',
                        needs_manual_review: false,
                        manual_review_by: teacherId,
                        manual_review_at: new Date()
                    });

                    attemptIds.add(answer.attempt_id);

                    results.push({
                        answerId,
                        success: true,
                        new_score: score
                    });

                } catch (error) {
                    results.push({
                        answerId: review.answerId,
                        success: false,
                        error: error.message
                    });
                }
            }

            // Recalculate total scores for affected attempts
            for (const attemptId of attemptIds) {
                await TeacherReviewController.recalculateAttemptScore(attemptId);
            }

            const successCount = results.filter(r => r.success).length;

            res.json({
                success: true,
                data: {
                    results,
                    summary: {
                        total: reviews.length,
                        successful: successCount,
                        failed: reviews.length - successCount
                    }
                },
                message: `Batch review completed: ${successCount}/${reviews.length} successful`
            });

        } catch (error) {
            console.error('Batch review error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process batch review',
                error: error.message
            });
        }
    }

    // Flag answer for review
    static async flagForReview(req, res) {
        try {
            const { answerId } = req.params;
            const { reason } = req.body;

            const answer = await AttemptAnswer.findByPk(answerId);
            if (!answer) {
                return res.status(404).json({
                    success: false,
                    message: 'Answer not found'
                });
            }

            await answer.update({
                needs_manual_review: true,
                review_reason: reason || 'Manual flag by teacher'
            });

            res.json({
                success: true,
                message: 'Answer flagged for manual review'
            });

        } catch (error) {
            console.error('Flag for review error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to flag answer for review',
                error: error.message
            });
        }
    }

    // Get review statistics
    static async getReviewStats(req, res) {
        try {
            const { timeframe = '30' } = req.query; // Days
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - parseInt(timeframe));

            const stats = await Promise.all([
                // Total pending reviews
                AttemptAnswer.count({
                    where: { needs_manual_review: true }
                }),
                
                // Reviews completed today
                AttemptAnswer.count({
                    where: {
                        manual_review_at: {
                            [Op.gte]: new Date().setHours(0, 0, 0, 0)
                        }
                    }
                }),

                // Average review time (in hours)
                sequelize.query(`
                    SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, manual_review_at)) as avg_review_time
                    FROM attempt_answers 
                    WHERE manual_review_at IS NOT NULL 
                    AND manual_review_at >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                `, { type: sequelize.QueryTypes.SELECT }),

                // Reviews by skill
                sequelize.query(`
                    SELECT 
                        q.skill_id,
                        COUNT(*) as review_count,
                        AVG(aa.score) as avg_score
                    FROM attempt_answers aa
                    JOIN questions q ON aa.question_id = q.id
                    WHERE aa.manual_review_at >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    GROUP BY q.skill_id
                `, { type: sequelize.QueryTypes.SELECT })
            ]);

            res.json({
                success: true,
                data: {
                    pending_reviews: stats[0],
                    completed_today: stats[1],
                    avg_review_time_hours: parseFloat(stats[2][0]?.avg_review_time) || 0,
                    reviews_by_skill: stats[3],
                    timeframe_days: timeframe
                }
            });

        } catch (error) {
            console.error('Get review stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve review statistics',
                error: error.message
            });
        }
    }

    // Helper method to recalculate attempt total score
    static async recalculateAttemptScore(attemptId) {
        try {
            const answers = await AttemptAnswer.findAll({
                where: { attempt_id: attemptId }
            });

            const totalScore = answers.reduce((sum, answer) => {
                return sum + (answer.score || 0);
            }, 0);

            const maxScore = answers.length * 10; // Assuming 10 points per question

            await ExamAttempt.update({
                total_score: totalScore,
                max_score: maxScore
            }, {
                where: { id: attemptId }
            });

        } catch (error) {
            console.error('Recalculate attempt score error:', error);
        }
    }
}

module.exports = TeacherReviewController;