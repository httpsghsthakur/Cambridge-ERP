require('dotenv').config({path: require('path').join(__dirname,'..','..','.env')});
const { User, sequelize } = require('../models');
(async()=>{
  try{
    const users = await User.findAll({attributes:['email','is_active','role']});
    console.log('📋 Users in the remote DB:');
    users.forEach(u=>{
      console.log(`- ${u.email} | role=${u.role} | active=${u.is_active}`);
    });
  }catch(err){
    console.error('Error fetching users:', err.message);
  }finally{
    await sequelize.close();
  }
})();

