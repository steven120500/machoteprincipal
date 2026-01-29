import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { amount, orderId, firstName, lastName, email } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    // Credenciales
    const API_USER = process.env.TILOPAY_USER;
    const API_PASSWORD = process.env.TILOPAY_PASSWORD;
    const KEY_ID = process.env.TILOPAY_API_KEY; 
    
    // URL de retorno (Usa la variable FRONTEND_URL o cae a la del machote por defecto)
    const BASE_URL = process.env.FRONTEND_URL || "https://machote.onrender.com";

    // DEBUG: Revisa esto en los logs de Render
    console.log("🔍 INTENTO DE PAGO:");
    console.log(`- Enviando Key ID: ${KEY_ID}`);
    console.log(`- Redirigiendo a: ${BASE_URL}`);

    if (!API_USER || !API_PASSWORD || !KEY_ID) {
      return res.status(500).json({ message: "Faltan credenciales en el servidor" });
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
      redirect_url: `${BASE_URL}/checkout?status=success`,
      cancel_url: `${BASE_URL}/checkout?status=cancel`
    };

    // INTENTO 1: Usar la URL API moderna
    try {
      const response = await axios.post(
        'https://api.tilopay.com/api/v1/process',
        payload,
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("✅ Link generado (API):", response.data.url);
      return res.json({ url: response.data.url });

    } catch (apiError) {
      console.warn("⚠️ Falló api.tilopay.com, intentando con app.tilopay.com...");
      
      // INTENTO 2: Usar la URL APP (Fallback por si tu cuenta es Legacy)
      const responseBackup = await axios.post(
        'https://app.tilopay.com/api/v1/process',
        payload,
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("✅ Link generado (APP):", responseBackup.data.url);
      return res.json({ url: responseBackup.data.url });
    }

  } catch (error) {
    const errorData = error.response?.data || {};
    const statusCode = error.response?.status || 500;

    console.error(`❌ ERROR TILOPAY FINAL (${statusCode}):`, JSON.stringify(errorData, null, 2));
    
    // Si es el error "Code 8", le damos una pista al usuario
    if (errorData?.path?.code === 8) {
      console.error("🚨 PISTA: El error 'Code 8' significa que el KEY ID es incorrecto o no existe.");
    }

    res.status(statusCode).json({ 
      message: "Error al conectar con la pasarela",
      detalle: errorData
    });
  }
});

export default router;