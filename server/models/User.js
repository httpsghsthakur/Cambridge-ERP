const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: {
    type: DataTypes.STRING(150), allowNull: false, unique: true
  },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM('admin', 'admin2', 'teacher', 'student', 'parent', 'fee_collector'),
    defaultValue: 'parent'
  },
  linked_student_id:  { type: DataTypes.INTEGER, allowNull: true },
  linked_teacher_id:  { type: DataTypes.INTEGER, allowNull: true },
  is_active:          { type: DataTypes.BOOLEAN, defaultValue: true },
  phone:              { type: DataTypes.STRING(15) },
  profile_photo:      { type: DataTypes.STRING(255) },
  // (M5 fix) — track password change time for token invalidation
  password_changed_at: { type: DataTypes.DATE, allowNull: true },
  login_attempts:     { type: DataTypes.INTEGER, defaultValue: 0 },
  lock_until:         { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12);
    }
  }
});

User.prototype.comparePassword = async function (candidate) {
  if (!this.password || !candidate) return false;

  const dbPass = String(this.password).trim();
  const cand = String(candidate).trim();

  // 1. Direct match (e.g. plaintext password in DB from phpMyAdmin / manual entry)
  if (dbPass === cand) {
    try {
      this.password = await bcrypt.hash(cand, 10);
      await this.save({ hooks: false });
    } catch (e) {
      // Safe to ignore if save back fails
    }
    return true;
  }

  // 2. Bcrypt hash match
  if (dbPass.startsWith('$2a$') || dbPass.startsWith('$2b$') || dbPass.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(cand, dbPass);
    } catch (e) {
      console.warn('[AUTH] Bcrypt compare error:', e.message);
    }
  }

  // 3. Fallback direct match
  return dbPass === cand;
};

module.exports = User;
