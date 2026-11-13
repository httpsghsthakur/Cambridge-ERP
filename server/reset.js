const { User } = require('./models');

async function reset() {
  try {
    const email = 'admin@gmail.com'; // Corrected the spelling from 'gmal.com' to 'gmail.com'
    const password = 'Admin@123';
    
    console.log('Clearing existing admin records with this email or typo...');
    await User.destroy({ 
      where: { 
        email: ['admin@gmail.com', 'admin@gmal.com', 'admin@school.com'] 
      } 
    });
    
    console.log('Creating fresh Admin user...');
    // This calls User.create() which triggers the beforeCreate hook to hash the password perfectly
    const admin = await User.create({
      name: 'Super Admin',
      email: email,
      password: password,
      role: 'admin',
      is_active: true
    });
    
    console.log('\n=============================================');
    console.log('✅ Admin Credentials Created Successfully!');
    console.log(`- Email: ${admin.email}`);
    console.log(`- Password: ${password}`);
    console.log('=============================================');
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
  }
  process.exit(0);
}

reset();
