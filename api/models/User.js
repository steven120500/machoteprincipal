import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true }, // Nombre
  lastName:  { type: String, required: true, trim: true }, // Apellido
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true }, // Correo (Login)
  password:  { type: String, required: true, select: false },
  roles:     [{ type: String }], // Ej: ['admin']
  isSuperUser: { type: Boolean, default: false }
}, {
  timestamps: true // Esto agrega createdAt y updatedAt automáticamente
});

export default mongoose.model('User', userSchema);