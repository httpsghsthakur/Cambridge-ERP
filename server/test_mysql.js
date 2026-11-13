const { Sequelize, DataTypes } = require('sequelize');

// Force MySQL dialect
const sequelize = new Sequelize('mysql://user:pass@localhost/db', {
  dialect: 'mysql',
  logging: console.log,
});

const User = sequelize.define('User', { name: DataTypes.STRING });
const DocumentSubmission = sequelize.define('DocumentSubmission', {
  request_id: DataTypes.INTEGER,
  user_id: DataTypes.INTEGER,
});
DocumentSubmission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// We won't sync, we will just use SQL string generation
async function test() {
  try {
    const sql = sequelize.dialect.queryGenerator.selectQuery('document_submissions', {
      model: DocumentSubmission,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name']
      }],
      order: [['id', 'DESC']],
      attributes: ['id', 'request_id']
    }, DocumentSubmission);
    console.log("GENERATED SQL:");
    console.log(sql);
  } catch (err) {
    console.error(err);
  }
}

test();
