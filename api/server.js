import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet'; // 🛡️ Seguridad extra
import morgan from 'morgan'; // 📝 Logs de peticiones
import connectDB from './config/db.js';

import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import historyRoutes from './routes/historyRoutes.js';

dotenv.config();

// 1. Validación de variables críticas (Evita que el server suba si falta algo)
const requiredEnvs = ['MONGO_URI', 'RESEND_API_KEY', 'FRONTEND_URL'];
requiredEnvs.forEach((env) => {
  if (!process.env[env]) {
    console.error(`❌ ERROR: Falta la variable de entorno ${env}`);
    process.exit(1);
  }
});

const app = express();

/* -------- ajustes generales -------- */
app.use(helmet());                          // Configura encabezados de seguridad automáticamente
app.disable('x-powered-by');                
app.set('json spaces', 0);                  
app.set('trust proxy', 1);                  

/* -------- middlewares globales -------- */
app.use(compression());                     
app.use(morgan('dev'));                     // Verás en la consola de Render cada clic: "POST /api/auth/login 200"

// 2. CORS DINÁMICO (Usa la variable de Render o localhost)
const allowedOrigins = [
  process.env.FRONTEND_URL, 
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir si no hay origen (Postman) o si está en la lista permitida
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
await connectDB();

/* -------- rutas de la app -------- */
app.use('/api/auth', authRoutes);
app.use('/api', pdfRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/products', productRoutes);

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