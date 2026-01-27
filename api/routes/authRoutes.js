import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

/**
 * 1️⃣ REGISTRO DE USUARIOS
 * Incluye validación de celular de 8 dígitos.
 */
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

/**
 * 2️⃣ LOGIN DE USUARIOS
 */
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
    console.error("Error en login:", error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

/**
 * 3️⃣ SOLICITAR RECUPERACIÓN (FORGOT PASSWORD)
 * Genera un token y envía el correo vía Resend.
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No existe un usuario con ese correo' });
    }

    // Generar token único
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Guardar versión hasheada del token en la DB (expira en 1 hora)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; 

    await user.save();

    // Construir URL (Prioriza la variable de entorno de Render)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Diseño del correo electrónico
    const message = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">FutStore - Recuperación</h2>
        <p>Hola, <strong>${user.firstName}</strong>.</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
             RESTABLECER MI CONTRASEÑA
          </a>
        </div>
        <p style="font-size: 12px; color: #777;">Este enlace es válido por 1 hora. Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.</p>
        <hr style="border: none; border-top: 1px solid #eee;">
        <p style="font-size: 10px; color: #aaa; text-align: center;">Si el botón no funciona, copia este link: <br> ${resetUrl}</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Recuperar Contraseña - FutStore',
        message
      });
      res.json({ message: 'Correo enviado con éxito' });
    } catch (err) {
      console.error("🚨 Error enviando con Resend:", err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ message: 'Error al enviar el correo' });
    }

  } catch (error) {
    console.error("Error en forgot-password:", error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/**
 * 4️⃣ RESTABLECER CONTRASEÑA (RESET PASSWORD)
 * Verifica el token y actualiza la contraseña.
 */
router.post('/reset-password/:token', async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'El enlace es inválido o ha expirado' });
    }

    // Encriptar y guardar nueva contraseña
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

/**
 * 🛠️ RUTAS DE ADMINISTRACIÓN
 */
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
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

export default router;