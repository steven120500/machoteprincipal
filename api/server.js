import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet'; 
import morgan from 'morgan'; 
import connectDB from './config/db.js';

// Rutas
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import tiloPayRoutes from './routes/tiloPayRoutes.js'; // 👈 NUEVO: Importar rutas de TiloPay

dotenv.config();

// 1. Validación de variables críticas (Agregamos las de TiloPay)
const requiredEnvs = [
  'MONGO_URI', 
  'RESEND_API_KEY', 
  'FRONTEND_URL',
  'TILOPAY_USER',      // 👈 REQUERIDO
  'TILOPAY_PASSWORD',  // 👈 REQUERIDO
  'TILOPAY_API_KEY'    // 👈 REQUERIDO
];

requiredEnvs.forEach((env) => {
  if (!process.env[env]) {
    console.warn(`⚠️ ADVERTENCIA: Falta la variable ${env}. El servidor podría fallar en esa función.`);
    // No hacemos exit(1) estricto para que al menos arranque si estás probando local
  }
});

const app = express();

/* -------- ajustes generales -------- */
app.use(helmet());                          
app.disable('x-powered-by');                
app.set('json spaces', 0);                  
app.set('trust proxy', 1);                  

/* -------- middlewares globales -------- */
app.use(compression());                     
app.use(morgan('dev'));                     

// 2. CORS DINÁMICO
const allowedOrigins = [
  process.env.FRONTEND_URL, 
  'http://localhost:5173',
  'http://127.0.0.1:5173' // A veces Vite levanta en esta IP
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Bloqueado por seguridad (CORS)'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

/* -------- body parsers -------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* -------- conecta DB ANTES de montar rutas -------- */
// Usamos try-catch para que no tumbe el server si Mongo falla al inicio (opcional pero recomendado)
try {
  await connectDB();
} catch (error) {
  console.error("❌ Error conectando a BD al inicio:", error.message);
}

/* -------- rutas de la app -------- */
app.use('/api/auth', authRoutes);
app.use('/api', pdfRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tilopay', tiloPayRoutes); // 👈 NUEVO: Activar la ruta /api/tilopay/create-link

/* -------- health checks -------- */
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok', t: Date.now() }));
app.get('/', (_req, res) => res.send('FUTSTORE BACKEND LIVE 🚀'));

/* -------- manejo de errores -------- */
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

/* -------- levantar -------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));