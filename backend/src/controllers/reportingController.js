const { Op } = require('sequelize');
const { 
    User, 
    ExamAttempt, 
    AttemptAnswer, 
    Question, 
    Exam, 
    PracticeSession,
    sequelize 
} = require('../models');

class ReportingController {
    // System Overview Dashboard
    static async getSystemOverview(req, res) {
        try {
            const { timeframe = '30' } = req.query; // Days
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - parseInt(timeframe));

            const overview = await Promise.all([
                // User statistics
                User.findAll({
                    attributes: [
                        'role',
                        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                    ],
                    group: ['role']
                }),

                // Total system counts
                Promise.all([
                    User.count(),
                    Exam.count(),
                    Question.count(),
                    ExamAttempt.count({ where: { status: 'completed' } })
                ]),

                // Recent activity (last 30 days)
                Promise.all([
                    User.count({
                        where: {
                            created_at: { [Op.gte]: fromDate }
                        }
                    }),
                    ExamAttempt.count({
                        where: {
                            start_time: { [Op.gte]: fromDate }
                        }
                    }),
                    PracticeSession.count({
                        where: {
                            created_at: { [Op.gte]: fromDate }
                        }
                    })
                ]),

                // Average scores by skill
                sequelize.query(`
                    SELECT 
                        q.skill_id,
                        COUNT(aa.id) as total_answers,
                        AVG(aa.score) as avg_score,
                        AVG(q.points) as max_possible_score
                    FROM attempt_answers aa
                    JOIN questions q ON aa.question_id = q.id
                    JOIN exam_attempts ea ON aa.attempt_id = ea.id
                    WHERE ea.start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    AND aa.score IS NOT NULL
                    GROUP BY q.skill_id
                `, { type: sequelize.QueryTypes.SELECT }),

                // System performance metrics
                sequelize.query(`
                    SELECT 
                        AVG(ea.time_spent_minutes) as avg_exam_time,
                        AVG(ea.percentage) as avg_score_percentage,
                        COUNT(ea.id) as total_attempts
                    FROM exam_attempts ea
                    WHERE ea.start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    AND ea.status = 'submitted'
                `, { type: sequelize.QueryTypes.SELECT })
            ]);

            const usersByRole = overview[0].reduce((acc, user) => {
                acc[user.role] = parseInt(user.get('count'));
                return acc;
            }, {});

            const [totalUsers, totalExams, totalQuestions, totalAttempts] = overview[1];
            const [newUsers, recentAttempts, recentPractice] = overview[2];

            res.json({
                success: true,
                data: {
                    system_totals: {
                        total_users: totalUsers,
                        total_exams: totalExams,
                        total_questions: totalQuestions,
                        total_attempts: totalAttempts
                    },
                    users_by_role: usersByRole,
                    recent_activity: {
                        new_users: newUsers,
                        exam_attempts: recentAttempts,
                        practice_sessions: recentPractice,
                        timeframe_days: parseInt(timeframe)
                    },
                    performance_by_skill: overview[3],
                    system_metrics: overview[4][0] || {}
                },
                generated_at: new Date()
            });

        } catch (error) {
            console.error('Get system overview error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate system overview',
                error: error.message
            });
        }
    }

    // User Analytics Report
    static async getUserAnalytics(req, res) {
        try {
            const { timeframe = '30', role, level_id } = req.query;
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - parseInt(timeframe));

            let userWhere = {
                created_at: { [Op.gte]: fromDate }
            };

            if (role) userWhere.role = role;
            if (level_id) userWhere.level_id = level_id;

            const analytics = await Promise.all([
                // User registration trends
                sequelize.query(`
                    SELECT 
                        DATE(created_at) as date,
                        COUNT(*) as registrations
                    FROM users 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    ${role ? `AND role = '${role}'` : ''}
                    ${level_id ? `AND level_id = ${level_id}` : ''}
                    GROUP BY DATE(created_at)
                    ORDER BY date
                `, { type: sequelize.QueryTypes.SELECT }),

                // User activity levels
                sequelize.query(`
                    SELECT 
                        u.id,
                        u.full_name,
                        u.email,
                        u.role,
                        COUNT(DISTINCT ea.id) as exam_attempts,
                        COUNT(DISTINCT ps.id) as practice_sessions,
                        AVG(ea.percentage) as avg_score,
                        MAX(ea.end_time) as last_activity
                    FROM users u
                    LEFT JOIN exam_attempts ea ON u.id = ea.user_id 
                        AND ea.start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    LEFT JOIN practice_sessions ps ON u.id = ps.user_id 
                        AND ps.created_at >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    ${role ? `AND u.role = '${role}'` : ''}
                    ${level_id ? `AND u.level_id = ${level_id}` : ''}
                    GROUP BY u.id
                    ORDER BY last_activity DESC
                `, { type: sequelize.QueryTypes.SELECT }),

                // Engagement metrics
                sequelize.query(`
                    SELECT 
                        'highly_active' as segment,
                        COUNT(DISTINCT u.id) as user_count
                    FROM users u
                    JOIN exam_attempts ea ON u.id = ea.user_id
                    WHERE ea.start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    GROUP BY u.id
                    HAVING COUNT(ea.id) >= 5
                    
                    UNION ALL
                    
                    SELECT 
                        'moderately_active' as segment,
                        COUNT(DISTINCT u.id) as user_count
                    FROM users u
                    JOIN exam_attempts ea ON u.id = ea.user_id
                    WHERE ea.start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    GROUP BY u.id
                    HAVING COUNT(ea.id) BETWEEN 2 AND 4
                    
                    UNION ALL
                    
                    SELECT 
                        'low_active' as segment,
                        COUNT(DISTINCT u.id) as user_count
                    FROM users u
                    JOIN exam_attempts ea ON u.id = ea.user_id
                    WHERE ea.start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    GROUP BY u.id
                    HAVING COUNT(ea.id) = 1
                `, { type: sequelize.QueryTypes.SELECT })
            ]);

            res.json({
                success: true,
                data: {
                    registration_trends: analytics[0],
                    user_activity: analytics[1],
                    engagement_segments: analytics[2].reduce((acc, segment) => {
                        acc[segment.segment] = parseInt(segment.user_count);
                        return acc;
                    }, {}),
                    filters_applied: {
                        timeframe_days: parseInt(timeframe),
                        role: role || 'all',
                        level_id: level_id || 'all'
                    }
                },
                generated_at: new Date()
            });

        } catch (error) {
            console.error('Get user analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate user analytics',
                error: error.message
            });
        }
    }

    // Exam Performance Report
    static async getExamPerformance(req, res) {
        try {
            const { timeframe = '30', exam_id, skill_id } = req.query;
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - parseInt(timeframe));

            let whereClause = {
                start_time: { [Op.gte]: fromDate },
                status: 'submitted'
            };

            if (exam_id) whereClause.exam_id = exam_id;

            const performance = await Promise.all([
                // Exam completion rates
                sequelize.query(`
                    SELECT 
                        e.id,
                        e.title,
                        COUNT(ea.id) as attempts,
                        COUNT(CASE WHEN ea.status = 'submitted' THEN 1 END) as completed,
                        AVG(ea.percentage) as avg_score,
                        AVG(ea.time_spent_minutes) as avg_time_taken
                    FROM exams e
                    LEFT JOIN exam_attempts ea ON e.id = ea.exam_id 
                        AND ea.start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    ${exam_id ? `WHERE e.id = ${exam_id}` : ''}
                    GROUP BY e.id
                    ORDER BY attempts DESC
                `, { type: sequelize.QueryTypes.SELECT }),

                // Score distribution
                sequelize.query(`
                    SELECT 
                        CASE 
                            WHEN percentage >= 90 THEN 'Excellent (90-100%)'
                            WHEN percentage >= 80 THEN 'Good (80-89%)'
                            WHEN percentage >= 70 THEN 'Fair (70-79%)'
                            WHEN percentage >= 60 THEN 'Pass (60-69%)'
                            ELSE 'Fail (<60%)'
                        END as score_range,
                        COUNT(*) as count
                    FROM exam_attempts
                    WHERE start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    AND status = 'submitted'
                    ${exam_id ? `AND exam_id = ${exam_id}` : ''}
                    GROUP BY score_range
                    ORDER BY count DESC
                `, { type: sequelize.QueryTypes.SELECT }),

                // Performance by skill
                sequelize.query(`
                    SELECT 
                        q.skill_id,
                        COUNT(aa.id) as total_answers,
                        AVG(aa.score / q.points * 100) as avg_score_percentage,
                        COUNT(CASE WHEN aa.is_correct = true THEN 1 END) as correct_answers
                    FROM attempt_answers aa
                    JOIN questions q ON aa.question_id = q.id
                    JOIN exam_attempts ea ON aa.attempt_id = ea.id
                    WHERE ea.start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    AND ea.status = 'submitted'
                    ${exam_id ? `AND ea.exam_id = ${exam_id}` : ''}
                    ${skill_id ? `AND q.skill_id = ${skill_id}` : ''}
                    GROUP BY q.skill_id
                    ORDER BY q.skill_id
                `, { type: sequelize.QueryTypes.SELECT }),

                // Difficulty analysis
                sequelize.query(`
                    SELECT 
                        q.id as question_id,
                        q.question_text,
                        q.type,
                        q.skill_id,
                        COUNT(aa.id) as attempts,
                        AVG(aa.score / q.points * 100) as avg_score_percentage,
                        COUNT(CASE WHEN aa.is_correct = true THEN 1 END) / COUNT(aa.id) * 100 as success_rate
                    FROM questions q
                    JOIN attempt_answers aa ON q.id = aa.question_id
                    JOIN exam_attempts ea ON aa.attempt_id = ea.id
                    WHERE ea.start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    AND ea.status = 'submitted'
                    ${exam_id ? `AND ea.exam_id = ${exam_id}` : ''}
                    ${skill_id ? `AND q.skill_id = ${skill_id}` : ''}
                    GROUP BY q.id
                    HAVING attempts >= 5
                    ORDER BY success_rate ASC
                    LIMIT 10
                `, { type: sequelize.QueryTypes.SELECT })
            ]);

            res.json({
                success: true,
                data: {
                    exam_overview: performance[0],
                    score_distribution: performance[1].reduce((acc, item) => {
                        acc[item.score_range] = parseInt(item.count);
                        return acc;
                    }, {}),
                    performance_by_skill: performance[2],
                    difficult_questions: performance[3],
                    filters_applied: {
                        timeframe_days: parseInt(timeframe),
                        exam_id: exam_id || 'all',
                        skill_id: skill_id || 'all'
                    }
                },
                generated_at: new Date()
            });

        } catch (error) {
            console.error('Get exam performance error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate exam performance report',
                error: error.message
            });
        }
    }

    // Content Usage Report
    static async getContentUsage(req, res) {
        try {
            const { timeframe = '30' } = req.query;
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - parseInt(timeframe));

            const usage = await Promise.all([
                // Question usage frequency
                sequelize.query(`
                    SELECT 
                        q.id,
                        q.question_text,
                        q.type,
                        q.skill_id,
                        COUNT(aa.id) as usage_count,
                        AVG(aa.score / q.points * 100) as avg_score_percentage
                    FROM questions q
                    LEFT JOIN attempt_answers aa ON q.id = aa.question_id
                    LEFT JOIN exam_attempts ea ON aa.attempt_id = ea.id
                    WHERE ea.created_at >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    GROUP BY q.id
                    ORDER BY usage_count DESC
                `, { type: sequelize.QueryTypes.SELECT }),

                // Exam popularity
                sequelize.query(`
                    SELECT 
                        e.id,
                        e.title,
                        e.description,
                        COUNT(ea.id) as attempt_count,
                        AVG(ea.percentage) as avg_score
                    FROM exams e
                    LEFT JOIN exam_attempts ea ON e.id = ea.exam_id 
                        AND ea.start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    GROUP BY e.id
                    ORDER BY attempt_count DESC
                `, { type: sequelize.QueryTypes.SELECT }),

                // Practice session patterns
                sequelize.query(`
                    SELECT 
                        skill_id,
                        COUNT(*) as session_count,
                        AVG(questions_attempted) as avg_questions_per_session,
                        AVG(correct_answers) as avg_correct_answers
                    FROM practice_sessions
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    GROUP BY skill_id
                    ORDER BY session_count DESC
                `, { type: sequelize.QueryTypes.SELECT }),

                // Unused content identification
                sequelize.query(`
                    SELECT 
                        'questions' as content_type,
                        COUNT(*) as unused_count
                    FROM questions q
                    WHERE NOT EXISTS (
                        SELECT 1 FROM attempt_answers aa
                        JOIN exam_attempts ea ON aa.attempt_id = ea.id
                        WHERE aa.question_id = q.id
                        AND ea.start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    )
                    
                    UNION ALL
                    
                    SELECT 
                        'exams' as content_type,
                        COUNT(*) as unused_count
                    FROM exams e
                    WHERE NOT EXISTS (
                        SELECT 1 FROM exam_attempts ea
                        WHERE ea.exam_id = e.id
                        AND ea.start_time >= DATE_SUB(NOW(), INTERVAL ${timeframe} DAY)
                    )
                `, { type: sequelize.QueryTypes.SELECT })
            ]);

            res.json({
                success: true,
                data: {
                    question_usage: usage[0],
                    exam_popularity: usage[1],
                    practice_patterns: usage[2],
                    unused_content: usage[3].reduce((acc, item) => {
                        acc[item.content_type] = parseInt(item.unused_count);
                        return acc;
                    }, {}),
                    summary: {
                        timeframe_days: parseInt(timeframe),
                        total_questions: usage[0].length,
                        total_exams: usage[1].length,
                        most_used_question: usage[0][0]?.question_text || 'N/A',
                        most_popular_exam: usage[1][0]?.title || 'N/A'
                    }
                },
                generated_at: new Date()
            });

        } catch (error) {
            console.error('Get content usage error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate content usage report',
                error: error.message
            });
        }
    }

    // Export report data as CSV
    static async exportReport(req, res) {
        try {
            const { type, format = 'json', timeframe = '30' } = req.query;

            let reportData;
            let filename;

            switch (type) {
                case 'overview':
                    reportData = await this.getSystemOverview({query: {timeframe}}, {json: () => {}});
                    filename = `system_overview_${timeframe}days`;
                    break;
                case 'users':
                    reportData = await this.getUserAnalytics({query: {timeframe}}, {json: () => {}});
                    filename = `user_analytics_${timeframe}days`;
                    break;
                case 'exams':
                    reportData = await this.getExamPerformance({query: {timeframe}}, {json: () => {}});
                    filename = `exam_performance_${timeframe}days`;
                    break;
                case 'content':
                    reportData = await this.getContentUsage({query: {timeframe}}, {json: () => {}});
                    filename = `content_usage_${timeframe}days`;
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid report type'
                    });
            }

            if (format === 'csv') {
                // Convert to CSV format
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
                
                // Simple CSV conversion (would need proper CSV library for production)
                const csvData = JSON.stringify(reportData, null, 2);
                res.send(csvData);
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
                res.json(reportData);
            }

        } catch (error) {
            console.error('Export report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export report',
                error: error.message
            });
        }
    }
}

module.exports = ReportingController;