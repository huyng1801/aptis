const express = require('express');
const router = express.Router();
const AudioController = require('../controllers/audioController');
const { authenticate, authorize } = require('../middlewares/auth');
const { audioUploadMiddleware } = require('../middlewares/audioUpload');

// Student routes for audio answers

/**
 * @swagger
 * /api/audio/attempts/{attemptId}/questions/{questionId}/audio:
 *   post:
 *     tags:
 *       - Student - Audio
 *     summary: Upload audio answer for a question
 *     description: Upload an audio response to a speaking question during exam attempt
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Exam attempt ID
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file (WAV, MP3, or OGG format)
 *     responses:
 *       200:
 *         description: Audio answer uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     audio_url:
 *                       type: string
 *                     uploaded_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid audio file or missing attempt/question
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student access required
 */
router.post('/attempts/:attemptId/questions/:questionId/audio', 
    authenticate, 
    authorize(['student']),
    audioUploadMiddleware,
    AudioController.uploadAudioAnswer
);

/**
 * @swagger
 * /api/audio/attempts/{attemptId}/questions/{questionId}/audio:
 *   delete:
 *     tags:
 *       - Student - Audio
 *     summary: Delete audio answer for a question
 *     description: Remove an audio response from an exam question before submission
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Exam attempt ID
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Audio answer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Audio answer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student access required
 */
router.delete('/attempts/:attemptId/questions/:questionId/audio',
    authenticate,
    authorize(['student']),
    AudioController.deleteAudioAnswer
);

// File serving route

/**
 * @swagger
 * /api/audio/files/{filename}:
 *   get:
 *     tags:
 *       - Student - Audio
 *     summary: Get audio file
 *     description: Download or stream an audio file by filename
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Audio filename
 *     responses:
 *       200:
 *         description: Audio file retrieved successfully
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Audio file not found
 *       401:
 *         description: Unauthorized
 */
router.get('/files/:filename',
    authenticate,
    AudioController.getAudioFile
);

// Review routes (for teachers/admins)

/**
 * @swagger
 * /api/audio/attempts/{attemptId}/audio-answers:
 *   get:
 *     tags:
 *       - Teacher/Admin - Audio Review
 *     summary: Get all audio answers for an exam attempt
 *     description: Retrieve all audio responses submitted in an exam for review
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Exam attempt ID
 *     responses:
 *       200:
 *         description: Audio answers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     audio_answers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           question_id:
 *                             type: integer
 *                           audio_url:
 *                             type: string
 *                           uploaded_at:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Attempt not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Teacher/Admin access required
 */
router.get('/attempts/:attemptId/audio-answers',
    authenticate,
    authorize(['teacher', 'admin']),
    AudioController.getAudioAnswers
);

module.exports = router;
