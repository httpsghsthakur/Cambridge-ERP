const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory:', { logging: false });

async function test() {
  await sequelize.query("CREATE TABLE test_table (created_at DATETIME)");
  const [res] = await sequelize.query("SHOW COLUMNS FROM test_table LIKE 'createdAt'");
  console.log("MATCHED:", res);
}
test();
