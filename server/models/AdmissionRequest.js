const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdmissionRequest = sequelize.define('AdmissionRequest', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  // Student details
  first_name:       { type: DataTypes.STRING(60),  allowNull: false },
  last_name:        { type: DataTypes.STRING(60),  allowNull: false },
  date_of_birth:    { type: DataTypes.DATEONLY },
  gender:           { type: DataTypes.ENUM('Male', 'Female', 'Other') },
  applying_class:   { type: DataTypes.STRING(20),  allowNull: false },
  // Parent details
  parent_name:      { type: DataTypes.STRING(100), allowNull: false },
  parent_phone:     { type: DataTypes.STRING(15),  allowNull: false },
  parent_email:     { type: DataTypes.STRING(150) },
  parent_address:   { type: DataTypes.TEXT },
  // Previous school
  previous_school:  { type: DataTypes.STRING(150) },
  // Workflow
  status: {
    type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  submitted_by:     { type: DataTypes.INTEGER },   // fee_collector user id
  reviewed_by:      { type: DataTypes.INTEGER },   // admin id
  review_notes:     { type: DataTypes.TEXT },
  approved_at:      { type: DataTypes.DATE },
  // If approved — student ID created
  student_id_created: { type: DataTypes.INTEGER, allowNull: true },
  // Fee paid at time of admission
  admission_fee_paid: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  documents_submitted: { type: DataTypes.JSON },   // array of doc names
}, { tableName: 'admission_requests' });

module.exports = AdmissionRequest;