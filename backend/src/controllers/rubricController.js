const { AIScoringRubric, Skill } = require('../models');

class RubricController {
  /**
   * Get rubrics by skill ID
   */
  async getRubricsBySkill(req, res) {
    try {
      const { skillId } = req.params;
      
      const rubrics = await AIScoringRubric.findAll({
        where: { skill_id: skillId },
        include: [
          {
            model: Skill,
            as: 'skill',
            attributes: ['id', 'name', 'description']
          }
        ],
        order: [['criteria_name', 'ASC']]
      });

      res.json({
        success: true,
        message: 'Rubrics retrieved successfully',
        data: {
          skill_id: skillId,
          rubrics
        }
      });
    } catch (error) {
      console.error('Get rubrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get rubrics',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Create new rubric
   */
  async createRubric(req, res) {
    try {
      const {
        skill_id,
        criteria_name,
        max_score,
        weight_percentage,
        description,
        ai_prompt_template
      } = req.body;

      const rubric = await AIScoringRubric.create({
        skill_id,
        criteria_name,
        max_score,
        weight_percentage,
        description,
        ai_prompt_template,
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Rubric created successfully',
        data: rubric
      });
    } catch (error) {
      console.error('Create rubric error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create rubric',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Update rubric
   */
  async updateRubric(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const rubric = await AIScoringRubric.findByPk(id);
      if (!rubric) {
        return res.status(404).json({
          success: false,
          message: 'Rubric not found'
        });
      }

      await rubric.update(updateData);

      res.json({
        success: true,
        message: 'Rubric updated successfully',
        data: rubric
      });
    } catch (error) {
      console.error('Update rubric error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update rubric',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Delete rubric
   */
  async deleteRubric(req, res) {
    try {
      const { id } = req.params;

      const rubric = await AIScoringRubric.findByPk(id);
      if (!rubric) {
        return res.status(404).json({
          success: false,
          message: 'Rubric not found'
        });
      }

      await rubric.destroy();

      res.json({
        success: true,
        message: 'Rubric deleted successfully'
      });
    } catch (error) {
      console.error('Delete rubric error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete rubric',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = new RubricController();