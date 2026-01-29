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
import tiloPayRoutes from './routes/tiloPayRoutes.js'; // 👈 ÚNICO archivo de pagos

dotenv.config();

// Validación de variables críticas
const requiredEnvs = [
  'MONGO_URI', 
  'RESEND_API_KEY',
  'FRONTEND_URL',      
  'TILOPAY_USER',      
  'TILOPAY_PASSWORD',  
  'TILOPAY_API_KEY'    
];

requiredEnvs.forEach((env) => {
  if (!process.env[env]) {
    console.warn(`⚠️ ADVERTENCIA: Falta la variable ${env}`);
  }
});

const app = express();

/* -------- SEGURIDAD Y LOGS -------- */
app.use(helmet());                          
app.disable('x-powered-by');                
app.set('json spaces', 0);                  
app.set('trust proxy', 1);                  
app.use(compression());                     
app.use(morgan('dev'));                     

// 2. CORS: Lista blanca de dominios permitidos
const allowedOrigins = [
  process.env.FRONTEND_URL,                  // Tu variable de entorno
  'https://machote.onrender.com',            // 👈 Tu Frontend Machote (visto en captura)
  'https://machoteprincipal.onrender.com',   // Tu Backend Machote
  'http://localhost:5173'                    // Local
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.error(`Bloqueado por CORS: ${origin}`);
    return callback(new Error('Bloqueado por seguridad (CORS)'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

/* -------- PARSERS -------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* -------- BASE DE DATOS -------- */
try {
  await connectDB();
} catch (error) {
  console.error("❌ Error DB:", error.message);
}

/* -------- RUTAS -------- */
app.use('/api/auth', authRoutes);
app.use('/api', pdfRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tilopay', tiloPayRoutes); // 👈 Ruta activa en: /api/tilopay/create-link

/* -------- HEALTH CHECK -------- */
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/', (_req, res) => res.send('BACKEND ONLINE 🚀'));

/* -------- ERROR HANDLING -------- */
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server en puerto ${PORT}`));