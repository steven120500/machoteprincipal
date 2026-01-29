import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet'; 
import morgan from 'morgan'; 
import connectDB from './config/db.js';

// --- IMPORTACIÓN DE RUTAS ---
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import tiloPayRoutes from './routes/tiloPayRoutes.js'; // 👈 Ruta de Pagos

dotenv.config();

// 1. Validación de variables de entorno críticas
// Esto te avisa en la consola si se te olvidó poner alguna clave en Render
const requiredEnvs = [
  'MONGO_URI', 
  'RESEND_API_KEY', 
  'TILOPAY_USER',      // 👈 Usuario TiloPay
  'TILOPAY_PASSWORD',  // 👈 Password TiloPay
  'TILOPAY_API_KEY'    // 👈 Key ID TiloPay
];

requiredEnvs.forEach((env) => {
  if (!process.env[env]) {
    console.warn(`⚠️ ADVERTENCIA: Falta la variable ${env}. Verifica tu archivo .env o Render.`);
  }
});

const app = express();

/* -------- AJUSTES DE SEGURIDAD Y LOGS -------- */
app.use(helmet());                          
app.disable('x-powered-by');                
app.set('json spaces', 0);                  
app.set('trust proxy', 1);                  

/* -------- MIDDLEWARES GLOBALES -------- */
app.use(compression());                     
app.use(morgan('dev'));                     

// 2. CORS (LISTA BLANCA DE DOMINIOS)
// Aquí definimos quién tiene permiso para hablar con tu backend
const allowedOrigins = [
  process.env.FRONTEND_URL, 
  'http://localhost:5173',                   // Tu PC (Local)
  'http://127.0.0.1:5173',                   // Tu PC (Alternativo)
  'https://fut-store-frontend.onrender.com', // Render (Frontend viejo/respaldo)
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir si no hay origen (como Postman) o si está en la lista blanca
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.error(`Bloqueado por CORS: ${origin}`);
    return callback(new Error('Bloqueado por seguridad (CORS)'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

/* -------- PARSEO DE DATOS -------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* -------- CONEXIÓN A BASE DE DATOS -------- */
try {
  await connectDB();
} catch (error) {
  console.error("❌ Error conectando a BD al inicio:", error.message);
}

/* -------- RUTAS DE LA API -------- */
app.use('/api/auth', authRoutes);
app.use('/api', pdfRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tilopay', tiloPayRoutes); // 👈 Aquí activamos la ruta de pagos

/* -------- HEALTH CHECKS (Para que Render sepa que estás vivo) -------- */
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok', t: Date.now() }));
app.get('/', (_req, res) => res.send('FUTSTORE BACKEND LIVE 🚀'));

/* -------- MANEJO DE ERRORES (404 y 500) -------- */
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

/* -------- INICIAR SERVIDOR -------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));