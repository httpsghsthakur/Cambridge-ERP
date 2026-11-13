const { DocumentSubmission, User } = require('./server/models');

async function test() {
  try {
    const submissions = await DocumentSubmission.findAll({
      where: { request_id: 1 },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role', 'username'] }
      ],
      order: [['created_at', 'DESC']]
    });
    console.log('Query successful');
  } catch (err) {
    console.error('Query failed:', err.message);
  }

  try {
    const submissions2 = await DocumentSubmission.findAll({
      where: { request_id: 1 },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    console.log('Query 2 successful');
  } catch (err) {
    console.error('Query 2 failed:', err.message);
  }
}

test();
