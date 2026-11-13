const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('sqlite::memory:', {
  logging: console.log,
  define: { timestamps: true, underscored: true }
});

const User = sequelize.define('User', { name: DataTypes.STRING });
const DocumentSubmission = sequelize.define('DocumentSubmission', {
  request_id: DataTypes.INTEGER,
  user_id: DataTypes.INTEGER,
});
DocumentSubmission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

async function test() {
  await sequelize.sync({ force: true });
  try {
    console.log("TESTING: order: [['id', 'DESC']]");
    await DocumentSubmission.findAll({
      where: { request_id: 1 },
      include: [{ model: User, as: 'user' }],
      order: [['id', 'DESC']]
    });
    console.log("SUCCESS");
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

test();
