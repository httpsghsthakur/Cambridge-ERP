const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('sqlite::memory:', {
  logging: console.log,
  define: { timestamps: true, underscored: true }
});

const User = sequelize.define('User', {
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  role: DataTypes.STRING,
  username: DataTypes.STRING
});

const DocumentSubmission = sequelize.define('DocumentSubmission', {
  request_id: DataTypes.INTEGER,
  user_id: DataTypes.INTEGER,
  file_url: DataTypes.STRING,
  custom_data: DataTypes.JSON,
  status: DataTypes.ENUM('pending', 'approved', 'rejected'),
  feedback: DataTypes.TEXT
}, {
  tableName: 'document_submissions'
});

DocumentSubmission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

async function test() {
  await sequelize.sync({ force: true });
  try {
    console.log("TESTING: order: [['createdAt', 'DESC']]");
    await DocumentSubmission.findAll({
      where: { request_id: 1 },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role', 'username'] }],
      order: [['createdAt', 'DESC']]
    });
    console.log("SUCCESS 1");
  } catch (err) {
    console.error("ERROR 1:", err.message);
  }

  try {
    console.log("TESTING: order: [['created_at', 'DESC']]");
    await DocumentSubmission.findAll({
      where: { request_id: 1 },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role', 'username'] }],
      order: [['created_at', 'DESC']]
    });
    console.log("SUCCESS 2");
  } catch (err) {
    console.error("ERROR 2:", err.message);
  }
}

test();
