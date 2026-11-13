module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY role ENUM('admin','admin2','teacher','student','parent','fee_collector') DEFAULT 'parent'"
    );

    await queryInterface.addColumn('students', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    });
    await queryInterface.addColumn('students', 'approval_status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'approved',
    });
    await queryInterface.addColumn('students', 'approved_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    });
    await queryInterface.addColumn('students', 'approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('students', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('students', 'rejection_reason');
    await queryInterface.removeColumn('students', 'approved_at');
    await queryInterface.removeColumn('students', 'approved_by');
    await queryInterface.removeColumn('students', 'approval_status');
    await queryInterface.removeColumn('students', 'created_by');
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY role ENUM('admin','admin2','teacher','parent','fee_collector') DEFAULT 'parent'"
    );
  },
};
