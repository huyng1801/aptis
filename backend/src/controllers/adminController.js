const User = require('../models/User');
const { Op, fn, col } = require('sequelize');

/**
 * Get all users (Admin only)
 * @route GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } }
      ];
    }
    if (role) {
      whereClause.role = role;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ['password_hash', 'verification_token', 'reset_password_token'] },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user (Admin only)
 * @route POST /api/admin/users
 */
const createUser = async (req, res, next) => {
  try {
    const { email, password, full_name, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password_hash: password,
      full_name,
      role,
      email_verified: true // Admin-created users are auto-verified
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (Admin only)
 * @route PUT /api/admin/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, role, is_active } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent modifying own account
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own account from this endpoint'
      });
    }

    await user.update({
      full_name: full_name !== undefined ? full_name : user.full_name,
      role: role !== undefined ? role : user.role,
      is_active: is_active !== undefined ? is_active : user.is_active
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (Admin only) - Soft delete
 * @route DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting own account
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Soft delete - set is_active to false instead of destroying
    await user.update({ is_active: false });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
