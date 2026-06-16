require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

const seedAdminUser = async () => {
  const adminEmail = 'admin@hopeconnect.org';
  const existing = await User.findOne({ email: adminEmail });

  if (existing) {
    console.log('Admin user already exists:', adminEmail);
    return;
  }

  await User.create({
    name: 'HopeConnect Admin',
    email: adminEmail,
    password: 'admin123',
    role: 'admin',
    phone: '+91 9876543210',
  });

  console.log('Admin user created successfully');
  console.log('Email: admin@hopeconnect.org');
  console.log('Password: admin123');
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedAdminUser();
      await disconnectDB();
      process.exit(0);
    } catch (error) {
      console.error('Seed failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = { seedAdminUser };
