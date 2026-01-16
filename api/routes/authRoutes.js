import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

// 1️⃣ Registro Seguro con Celular
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, roles } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (!/^\d{8}$/.test(phone)) {
      return res.status(400).json({ message: 'El celular debe tener exactamente 8 números' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Este correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      roles: roles || [],
      isSuperUser: false
    });

    await newUser.save();
    res.status(201).json({ message: 'Usuario registrado correctamente' });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

// 2️⃣ Login Seguro
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      isSuperUser: user.isSuperUser,
    });

  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

// 3️⃣ Solicitar Recuperación de Contraseña (CON LOGS DE ERROR)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No existe un usuario con ese correo' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; 

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const message = `
      <h1>Recuperación de contraseña</h1>
      <p>Has solicitado restablecer tu contraseña en FutStore.</p>
      <p>Por favor, haz clic en el siguiente enlace para continuar:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>Este enlace expirará en 1 hora.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Recuperar Contraseña - FutStore',
        message
      });
      res.json({ message: 'Correo enviado con éxito' });
    } catch (err) {
      // ✅ ESTA LÍNEA ES CLAVE: Imprime el error real en la consola de Render
      console.error("🚨 ERROR DETALLADO DE NODEMAILER:", err);
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ message: 'No se pudo enviar el correo' });
    }

  } catch (error) {
    console.error("Error en forgot-password:", error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// 4️⃣ Resetear Contraseña con Token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.json({ message: 'Contraseña actualizada correctamente' });

  } catch (error) {
    console.error("Error en reset-password:", error);
    res.status(500).json({ message: 'Error al actualizar contraseña' });
  }
});

// --- Rutas de gestión ---
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

export default router;