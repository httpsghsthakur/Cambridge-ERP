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
  // Enterprise Password Migration (Auto-Upgrade):
  // If the DB contains a plaintext password (e.g. from manual DB edits or legacy systems),
  // we verify it, immediately upgrade it to a secure bcrypt hash, and save it back to the DB.
  if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$') && !this.password.startsWith('$2y$')) {
    if (this.password === candidate) {
      // 1. Hash the password securely
      this.password = await bcrypt.hash(candidate, 12);
      // 2. Save it back to the database instantly (bypassing hooks to prevent double-hashing)
      await this.save({ hooks: false });
      return true; // Login succeeds, and DB is now secure!
    }
    return false;
  }
  return await bcrypt.compare(candidate, this.password);
};

module.exports = User;
