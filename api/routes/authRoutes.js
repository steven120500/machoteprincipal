import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

// Registro Seguro (Nombre, Apellido, Email, Password)
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, roles } = req.body;

    // 1. Validaciones básicas
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // 2. Verificar si el correo ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Este correo ya está registrado' });
    }

    // 3. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Crear usuario
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      roles: roles || [], // Por defecto array vacío
      isSuperUser: false  // Por seguridad, nadie se registra como SuperUser directo
    });

    await newUser.save();
    res.status(201).json({ message: 'Usuario registrado correctamente' });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

// Login Seguro (Email y Password)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar usuario por email (incluyendo la contraseña para comparar)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 2. Comparar contraseñas
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 3. Responder con datos (SIN la contraseña)
    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles,
      isSuperUser: user.isSuperUser,
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

// Obtener usuarios (Solo para admin si lo necesitas)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // No devolver contraseñas
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Eliminar usuario
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

export default router;