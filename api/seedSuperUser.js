import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();
await connectDB();

const hashedPassword = await bcrypt.hash('Steven1205coal', 10);

const superUser = new User({
  username: 'scorrales18@gmail.com',            // Usamos username, no email
  password: hashedPassword,
  isSuperUser: true,
  roles: ['add', 'edit', 'delete'],
});

try {
  const existingUser = await User.findOne({ username: 'scorrales18@gmail.com' });
  if (existingUser) {
    console.log('⚠️ Usuario ya existe, eliminando...');
    await User.deleteOne({ username: 'scorrales18@gmail.com' });
  }

  await superUser.save();
  console.log('✅ Súper usuario creado exitosamente');
} catch (err) {
  console.error('❌ Error al crear el usuario:', err.message);
} finally {
  mongoose.disconnect();
}