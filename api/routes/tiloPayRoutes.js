import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { amount, orderId, firstName, lastName, email } = req.body;

    // Validación estricta para evitar el error "Faltan datos"
    if (!amount || !email) {
      console.error("❌ Faltan datos en el body:", req.body);
      return res.status(400).json({ message: "Faltan datos obligatorios (monto o email)" });
    }

    // Leer Credenciales
    const API_USER = process.env.TILOPAY_USER;
    const API_PASSWORD = process.env.TILOPAY_PASSWORD;
    const KEY_ID = process.env.TILOPAY_API_KEY; 
    
    // URL de retorno (Usa la variable o la del machote por defecto)
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    // DEBUG: Revisa esto en los logs de Render para cazar el error Code 8
    console.log("🔍 DIAGNÓSTICO TILOPAY:");
    console.log(`- User Configurado: ${API_USER ? 'SÍ' : 'NO'}`);
    console.log(`- Key ID a enviar: '${KEY_ID}'`); // ¡Fíjate si aquí salen espacios en blanco!
    console.log(`- Retorno a: ${FRONTEND}`);

    if (!API_USER || !API_PASSWORD || !KEY_ID) {
      return res.status(500).json({ message: "Faltan credenciales en el servidor (Environment Variables)" });
    }

    const authString = Buffer.from(`${API_USER}:${API_PASSWORD}`).toString('base64');

    const payload = {
      key_id: KEY_ID,
      amount: amount,
      currency: "CRC",
      bill_to_first_name: firstName || "Cliente",
      bill_to_last_name: lastName || "FutStore",
      bill_to_email: email,
      order_id: orderId || `ORD-${Date.now()}`,
      description: `Compra FutStore #${orderId}`,
      redirect_url: `${FRONTEND}/checkout?status=success`,
      cancel_url: `${FRONTEND}/checkout?status=cancel`
    };

    // --- LÓGICA DE DOBLE INTENTO ---
    
    // INTENTO 1: API Moderna
    try {
      console.log("📡 Intentando conectar a: api.tilopay.com...");
      const response = await axios.post(
        'https://api.tilopay.com/api/v1/process',
        payload,
        { headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' } }
      );
      console.log("✅ Éxito con API Moderna:", response.data.url);
      return res.json({ url: response.data.url });

    } catch (apiError) {
      console.warn(`⚠️ Falló api.tilopay.com (${apiError.response?.status}). Probando alternativa...`);
      
      // INTENTO 2: API Legacy (app.tilopay.com)
      try {
        const responseBackup = await axios.post(
          'https://app.tilopay.com/api/v1/process',
          payload,
          { headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' } }
        );
        console.log("✅ Éxito con API Legacy:", responseBackup.data.url);
        return res.json({ url: responseBackup.data.url });

      } catch (appError) {
        // Si fallan las dos, lanzamos el error real
        throw appError; 
      }
    }

  } catch (error) {
    const errorData = error.response?.data || {};
    const statusCode = error.response?.status || 500;

    console.error(`❌ ERROR FINAL (${statusCode}):`, JSON.stringify(errorData, null, 2));
    
    // Pista específica para tu error Code 8
    if (JSON.stringify(errorData).includes('"code":8')) {
      console.error("🚨 IMPORTANTE: El Error Code 8 confirma que el KEY ID es incorrecto. Revisa espacios en blanco en Render.");
    }

    res.status(statusCode).json({ 
      message: "Error al conectar con la pasarela",
      detalle: errorData
    });
  }
});

export default router;