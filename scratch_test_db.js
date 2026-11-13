const { DocumentSubmission, User } = require('./server/models');

async function test() {
  try {
    const submissions = await DocumentSubmission.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role', 'username'] }
      ]
    });
    console.log('SUCCESS:', submissions.length, 'submissions found');
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}

test();
