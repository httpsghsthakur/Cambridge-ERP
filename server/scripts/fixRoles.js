const db = require('../models');

async function fixRoles() {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to database.');

    const users = await db.User.findAll({
      include: [{ model: db.Teacher, as: 'linkedTeacher' }]
    });

    let updatedCount = 0;

    for (const user of users) {
      if (user.linkedTeacher) {
        let newRole = null;
        if (user.linkedTeacher.staff_type === 'Fee Collector') {
          newRole = 'fee_collector';
        } else if (user.linkedTeacher.staff_type === 'Principal' || user.linkedTeacher.staff_type === 'Vice Principal') {
          newRole = 'admin2';
        }

        if (newRole && user.role !== newRole) {
          user.role = newRole;
          await user.save();
          console.log(`[FIXED] User ${user.email} (${user.name}) role updated to '${newRole}'`);
          updatedCount++;
        }
      }
    }

    console.log(`Done! Fixed roles for ${updatedCount} users.`);
    process.exit(0);
  } catch (err) {
    console.error('Error fixing roles:', err);
    process.exit(1);
  }
}

fixRoles();
