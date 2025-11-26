const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { AttemptAnswer, ExamAttempt, Question, User } = require('../models');
const { uploadDir } = require('../middlewares/audioUpload');

class AudioController {
    // Upload audio answer for speaking questions
    static async uploadAudioAnswer(req, res) {
        try {
            const { attemptId, questionId } = req.params;
            const userId = req.user.id;
            
            // Verify file upload
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No audio file uploaded'
                });
            }

            // Verify exam attempt belongs to user
            const attempt = await ExamAttempt.findOne({
                where: { 
                    id: attemptId, 
                    user_id: userId,
                    status: 'in_progress'
                }
            });

            if (!attempt) {
                // Clean up uploaded file
                fs.unlinkSync(req.file.path);
                return res.status(404).json({
                    success: false,
                    message: 'Exam attempt not found or not in progress'
                });
            }

            // Verify question exists and is a speaking question
            const question = await Question.findOne({
                where: { 
                    id: questionId,
                    skill_id: 4 // Speaking skill
                }
            });

            if (!question) {
                // Clean up uploaded file
                fs.unlinkSync(req.file.path);
                return res.status(404).json({
                    success: false,
                    message: 'Speaking question not found'
                });
            }

            // Generate audio URL
            const audioUrl = `/uploads/audio/${req.file.filename}`;

            // Save or update answer with audio
            const [answer, created] = await AttemptAnswer.upsert({
                attempt_id: attemptId,
                question_id: questionId,
                answer_text: '', // Empty for audio answers
                audio_url: audioUrl,
                is_correct: null, // To be determined by AI scoring
                score: null,
                submitted_at: new Date()
            });

            res.json({
                success: true,
                data: {
                    answer_id: answer.id,
                    audio_url: audioUrl,
                    filename: req.file.filename,
                    size: req.file.size,
                    uploaded_at: new Date(),
                    status: 'uploaded'
                },
                message: 'Audio answer uploaded successfully'
            });

        } catch (error) {
            console.error('Upload audio answer error:', error);
            
            // Clean up uploaded file on error
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to upload audio answer',
                error: error.message
            });
        }
    }

    // Get audio file for playback
    static async getAudioFile(req, res) {
        try {
            const { filename } = req.params;
            const filePath = path.join(uploadDir, filename);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'Audio file not found'
                });
            }

            // Verify user has access to this audio file
            const answer = await AttemptAnswer.findOne({
                where: { audio_url: `/uploads/audio/${filename}` },
                include: [{
                    model: ExamAttempt,
                    where: { user_id: req.user.id }
                }]
            });

            if (!answer && req.user.role !== 'admin' && req.user.role !== 'teacher') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Set appropriate headers
            const stat = fs.statSync(filePath);
            const fileExtension = path.extname(filename).toLowerCase();
            
            let contentType = 'audio/mpeg';
            if (fileExtension === '.wav') contentType = 'audio/wav';
            if (fileExtension === '.ogg') contentType = 'audio/ogg';
            if (fileExtension === '.webm') contentType = 'audio/webm';
            if (fileExtension === '.m4a') contentType = 'audio/mp4';

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Accept-Ranges', 'bytes');

            // Stream the file
            const readStream = fs.createReadStream(filePath);
            readStream.pipe(res);

        } catch (error) {
            console.error('Get audio file error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve audio file',
                error: error.message
            });
        }
    }

    // Delete audio answer
    static async deleteAudioAnswer(req, res) {
        try {
            const { attemptId, questionId } = req.params;
            const userId = req.user.id;

            // Find the answer
            const answer = await AttemptAnswer.findOne({
                where: { 
                    attempt_id: attemptId,
                    question_id: questionId
                },
                include: [{
                    model: ExamAttempt,
                    where: { 
                        user_id: userId,
                        status: 'in_progress'
                    }
                }]
            });

            if (!answer) {
                return res.status(404).json({
                    success: false,
                    message: 'Audio answer not found or cannot be deleted'
                });
            }

            // Delete audio file if exists
            if (answer.audio_url) {
                const filename = path.basename(answer.audio_url);
                const filePath = path.join(uploadDir, filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            // Delete answer record
            await answer.destroy();

            res.json({
                success: true,
                message: 'Audio answer deleted successfully'
            });

        } catch (error) {
            console.error('Delete audio answer error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete audio answer',
                error: error.message
            });
        }
    }

    // Get audio answers for an attempt (for review)
    static async getAudioAnswers(req, res) {
        try {
            const { attemptId } = req.params;

            // Verify access
            const attempt = await ExamAttempt.findOne({
                where: { id: attemptId },
                include: [{ model: User, as: 'user' }]
            });

            if (!attempt) {
                return res.status(404).json({
                    success: false,
                    message: 'Exam attempt not found'
                });
            }

            // Check access permissions
            const isOwner = attempt.user_id === req.user.id;
            const isTeacherOrAdmin = ['teacher', 'admin'].includes(req.user.role);

            if (!isOwner && !isTeacherOrAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Get all audio answers for this attempt
            const audioAnswers = await AttemptAnswer.findAll({
                where: { 
                    attempt_id: attemptId,
                    audio_url: { [Op.not]: null }
                },
                include: [{
                    model: Question,
                    as: 'question'
                }],
                order: [['question', 'id', 'ASC']]
            });

            res.json({
                success: true,
                data: {
                    attempt_id: attemptId,
                    student: attempt.user.full_name,
                    audio_answers: audioAnswers.map(answer => ({
                        question_id: answer.question_id,
                        question_text: answer.question.question_text,
                        question_type: answer.question.type,
                        audio_url: answer.audio_url,
                        score: answer.score,
                        is_correct: answer.is_correct,
                        submitted_at: answer.submitted_at
                    }))
                }
            });

        } catch (error) {
            console.error('Get audio answers error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve audio answers',
                error: error.message
            });
        }
    }
}

module.exports = AudioController;