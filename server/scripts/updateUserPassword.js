require('dotenv').config({path: require('path').join(__dirname,'..','..','.env')});
const { User, sequelize } = require('../models');
const email = process.argv[2];
const newPass = process.argv[3];
if(!email||!newPass){
  console.error('Usage: node updateUserPassword.js <email> <newPassword>');
  process.exit(1);
}
(async()=>{
  try{
    const user = await User.findOne({
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), email.trim().toLowerCase())
    });
    if(!user){
      console.error('User not found');
      return;
    }
    user.password = newPass; // plain text, will be hashed on next login via comparePassword logic
    await user.save({hooks:false}); // skip hooks to avoid double hashing
    console.log('✅ Password updated for', email);
  }catch(err){
    console.error('Error updating password:', err);
  }finally{
    await sequelize.close();
  }
})();

