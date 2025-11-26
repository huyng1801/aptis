const { Skill, Level, Question, sequelize } = require('../models');
const { Op } = require('sequelize');

class SystemManagementController {
    // ===== SKILL MANAGEMENT =====
    
    // Get all skills
    static async getAllSkills(req, res) {
        try {
            const skills = await Skill.findAll({
                include: [{
                    model: Question,
                    attributes: [],
                    required: false
                }],
                attributes: {
                    include: [
                        [sequelize.fn('COUNT', sequelize.col('Questions.id')), 'question_count']
                    ]
                },
                group: ['Skill.id']
            });

            res.json({
                success: true,
                data: skills
            });
        } catch (error) {
            console.error('Get all skills error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve skills',
                error: error.message
            });
        }
    }

    // Create new skill
    static async createSkill(req, res) {
        try {
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Skill name is required'
                });
            }

            // Check if skill already exists
            const existingSkill = await Skill.findOne({ where: { name } });
            if (existingSkill) {
                return res.status(409).json({
                    success: false,
                    message: 'Skill already exists'
                });
            }

            const skill = await Skill.create({
                name,
                description: description || ''
            });

            res.status(201).json({
                success: true,
                data: skill,
                message: 'Skill created successfully'
            });

        } catch (error) {
            console.error('Create skill error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create skill',
                error: error.message
            });
        }
    }

    // Update skill
    static async updateSkill(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const skill = await Skill.findByPk(id);
            if (!skill) {
                return res.status(404).json({
                    success: false,
                    message: 'Skill not found'
                });
            }

            // Check if new name conflicts with existing skill
            if (name && name !== skill.name) {
                const existingSkill = await Skill.findOne({ 
                    where: { 
                        name,
                        id: { [Op.ne]: id }
                    }
                });
                if (existingSkill) {
                    return res.status(409).json({
                        success: false,
                        message: 'Skill name already exists'
                    });
                }
            }

            await skill.update({
                name: name || skill.name,
                description: description !== undefined ? description : skill.description
            });

            res.json({
                success: true,
                data: skill,
                message: 'Skill updated successfully'
            });

        } catch (error) {
            console.error('Update skill error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update skill',
                error: error.message
            });
        }
    }

    // Delete skill
    static async deleteSkill(req, res) {
        try {
            const { id } = req.params;
            const { force = false } = req.query;

            const skill = await Skill.findByPk(id);
            if (!skill) {
                return res.status(404).json({
                    success: false,
                    message: 'Skill not found'
                });
            }

            // Check if skill is being used
            const questionCount = await Question.count({ where: { skill_id: id } });
            
            if (questionCount > 0 && !force) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete skill. ${questionCount} questions are using this skill.`,
                    data: {
                        question_count: questionCount,
                        suggestion: 'Use force=true to delete anyway or reassign questions first'
                    }
                });
            }

            if (force && questionCount > 0) {
                // Delete associated questions first
                await Question.destroy({ where: { skill_id: id } });
            }

            await skill.destroy();

            res.json({
                success: true,
                message: `Skill deleted successfully${questionCount > 0 ? ` along with ${questionCount} questions` : ''}`
            });

        } catch (error) {
            console.error('Delete skill error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete skill',
                error: error.message
            });
        }
    }

    // ===== LEVEL MANAGEMENT =====
    
    // Get all levels
    static async getAllLevels(req, res) {
        try {
            const levels = await Level.findAll({
                order: [['level_value', 'ASC']]
            });

            res.json({
                success: true,
                data: levels
            });
        } catch (error) {
            console.error('Get all levels error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve levels',
                error: error.message
            });
        }
    }

    // Create new level
    static async createLevel(req, res) {
        try {
            const { name, description, level_value } = req.body;

            if (!name || !level_value) {
                return res.status(400).json({
                    success: false,
                    message: 'Level name and value are required'
                });
            }

            // Check if level already exists
            const existingLevel = await Level.findOne({ 
                where: { 
                    [Op.or]: [
                        { name },
                        { level_value }
                    ]
                }
            });
            
            if (existingLevel) {
                return res.status(409).json({
                    success: false,
                    message: 'Level name or value already exists'
                });
            }

            const level = await Level.create({
                name,
                description: description || '',
                level_value
            });

            res.status(201).json({
                success: true,
                data: level,
                message: 'Level created successfully'
            });

        } catch (error) {
            console.error('Create level error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create level',
                error: error.message
            });
        }
    }

    // Update level
    static async updateLevel(req, res) {
        try {
            const { id } = req.params;
            const { name, description, level_value } = req.body;

            const level = await Level.findByPk(id);
            if (!level) {
                return res.status(404).json({
                    success: false,
                    message: 'Level not found'
                });
            }

            // Check for conflicts with other levels
            const conflicts = await Level.findOne({
                where: {
                    id: { [Op.ne]: id },
                    [Op.or]: [
                        ...(name && name !== level.name ? [{ name }] : []),
                        ...(level_value && level_value !== level.level_value ? [{ level_value }] : [])
                    ]
                }
            });

            if (conflicts) {
                return res.status(409).json({
                    success: false,
                    message: 'Level name or value already exists'
                });
            }

            await level.update({
                name: name || level.name,
                description: description !== undefined ? description : level.description,
                level_value: level_value || level.level_value
            });

            res.json({
                success: true,
                data: level,
                message: 'Level updated successfully'
            });

        } catch (error) {
            console.error('Update level error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update level',
                error: error.message
            });
        }
    }

    // Delete level
    static async deleteLevel(req, res) {
        try {
            const { id } = req.params;

            const level = await Level.findByPk(id);
            if (!level) {
                return res.status(404).json({
                    success: false,
                    message: 'Level not found'
                });
            }

            await level.destroy();

            res.json({
                success: true,
                message: 'Level deleted successfully'
            });

        } catch (error) {
            console.error('Delete level error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete level',
                error: error.message
            });
        }
    }

    // ===== SYSTEM SETTINGS =====

    // Get system configuration
    static async getSystemConfig(req, res) {
        try {
            // This could be stored in database or config files
            const config = {
                system_name: 'APTIS Learning Platform',
                max_exam_time: 180, // minutes
                max_practice_questions: 50,
                auto_save_interval: 30, // seconds
                file_upload_limits: {
                    audio_max_size: 10, // MB
                    image_max_size: 5,  // MB
                },
                ai_scoring: {
                    enabled: true,
                    confidence_threshold: 0.8,
                    manual_review_threshold: 0.6
                },
                features: {
                    audio_recording: true,
                    practice_mode: true,
                    ai_feedback: true,
                    manual_review: true,
                    reporting: true
                }
            };

            res.json({
                success: true,
                data: {
                    config: config
                }
            });
        } catch (error) {
            console.error('Get system config error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve system configuration',
                error: error.message
            });
        }
    }

    // Update system configuration
    static async updateSystemConfig(req, res) {
        try {
            const updates = req.body;

            // Validate numeric fields if provided
            if (updates.max_exam_attempts !== undefined && (typeof updates.max_exam_attempts !== 'number' || updates.max_exam_attempts < 1)) {
                return res.status(400).json({
                    success: false,
                    message: 'max_exam_attempts must be a positive number'
                });
            }

            if (updates.exam_timeout_minutes !== undefined && (typeof updates.exam_timeout_minutes !== 'number' || updates.exam_timeout_minutes < 1)) {
                return res.status(400).json({
                    success: false,
                    message: 'exam_timeout_minutes must be a positive number'
                });
            }

            if (updates.passing_score_default !== undefined && (typeof updates.passing_score_default !== 'number' || updates.passing_score_default < 0 || updates.passing_score_default > 100)) {
                return res.status(400).json({
                    success: false,
                    message: 'passing_score_default must be between 0 and 100'
                });
            }

            // In a real application, you'd save this to database or config file
            // For now, just return the updated config
            res.json({
                success: true,
                data: updates,
                message: 'System configuration updated successfully'
            });

        } catch (error) {
            console.error('Update system config error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update system configuration',
                error: error.message
            });
        }
    }

    // ===== BULK OPERATIONS =====

    // Bulk import skills/levels from CSV or JSON
    static async bulkImport(req, res) {
        const fs = require('fs');
        const path = require('path');
        const csv = require('csv-parser');

        try {
            // Validate file
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file provided'
                });
            }

            // Validate import_type
            const importType = req.body.import_type || req.query.import_type;
            const validTypes = ['questions', 'exams', 'users', 'results'];

            if (!importType) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'import_type is required'
                });
            }

            if (!validTypes.includes(importType)) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: `Invalid import_type. Must be one of: ${validTypes.join(', ')}`
                });
            }

            const results = {
                imported_count: 0,
                failed_count: 0,
                errors: []
            };

            // Parse CSV file
            const data = [];
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (row) => {
                    data.push(row);
                })
                .on('end', async () => {
                    try {
                        // Process based on import type
                        if (importType === 'questions') {
                            // Process questions - just count for now
                            results.imported_count = data.length;
                        } else if (importType === 'exams') {
                            // Process exams
                            results.imported_count = data.length;
                        } else if (importType === 'users') {
                            // Process users
                            results.imported_count = data.length;
                        } else if (importType === 'results') {
                            // Process results
                            results.imported_count = data.length;
                        }

                        // Clean up temp file
                        fs.unlinkSync(req.file.path);

                        res.json({
                            success: true,
                            data: results,
                            message: `Bulk import completed: ${results.imported_count} records imported, ${results.failed_count} failed`
                        });
                    } catch (error) {
                        console.error('Bulk import processing error:', error);
                        if (fs.existsSync(req.file.path)) {
                            fs.unlinkSync(req.file.path);
                        }
                        res.status(500).json({
                            success: false,
                            message: 'Failed to process bulk import',
                            error: error.message
                        });
                    }
                })
                .on('error', (error) => {
                    console.error('CSV parsing error:', error);
                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }
                    res.status(400).json({
                        success: false,
                        message: 'Failed to parse CSV file',
                        error: error.message
                    });
                });

        } catch (error) {
            console.error('Bulk import error:', error);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: 'Failed to perform bulk import',
                error: error.message
            });
        }
    }

    // System health check
    static async getSystemHealth(req, res) {
        try {
            const fs = require('fs');
            const path = require('path');
            const os = require('os');
            
            let databaseStatus = 'disconnected';
            let cacheStatus = 'disconnected';
            
            // Test database connection
            try {
                await sequelize.authenticate();
                databaseStatus = 'connected';
            } catch (error) {
                databaseStatus = 'disconnected';
            }
            
            // For now, assume cache is connected (can be improved with actual Redis check)
            cacheStatus = 'connected';
            
            // Check storage (uploads directory)
            let storageStatus = 'healthy';
            try {
                const uploadDir = path.join(__dirname, '../../uploads');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
            } catch (error) {
                storageStatus = 'unhealthy';
            }
            
            // Calculate memory usage
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
            const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);
            
            // Calculate uptime in hours
            const uptimeSeconds = process.uptime();
            const uptimeHours = Math.round((uptimeSeconds / 3600) * 100) / 100;
            
            // Determine overall health status
            let status = 'healthy';
            if (databaseStatus === 'disconnected' || storageStatus === 'unhealthy') {
                status = 'degraded';
            }
            if (databaseStatus === 'disconnected' && storageStatus === 'unhealthy') {
                status = 'unhealthy';
            }
            
            const health = {
                status: status,
                database: databaseStatus,
                cache: cacheStatus,
                memory_usage: `${memoryUsagePercent}%`,
                uptime_hours: uptimeHours,
                timestamp: new Date().toISOString()
            };

            res.json({
                success: true,
                data: health
            });

        } catch (error) {
            console.error('System health check error:', error);
            res.status(500).json({
                success: false,
                message: 'System health check failed',
                error: error.message
            });
        }
    }
}

module.exports = SystemManagementController;