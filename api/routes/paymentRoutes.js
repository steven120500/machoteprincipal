import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { amount, orderId, firstName, lastName, email } = req.body;

    // 1. Validar datos mínimos
    if (!amount || !email) {
      return res.status(400).json({ message: "Faltan datos (monto o email)" });
    }

    // 2. Obtener credenciales de las variables de entorno
    const API_USER = process.env.TILOPAY_API_USER;
    const API_PASSWORD = process.env.TILOPAY_API_PASSWORD;
    const KEY_ID = process.env.TILOPAY_KEY_ID;

    // 3. Crear la autenticación Basic (Usuario:Password en Base64)
    // Usamos Buffer de Node.js, así no necesitas instalar librerías extra
    const authString = Buffer.from(`${API_USER}:${API_PASSWORD}`).toString('base64');

    // 4. Configurar el cuerpo de la petición (Payload)
    const payload = {
      key_id: KEY_ID,
      amount: amount,
      currency: "CRC", // Colones
      bill_to_first_name: firstName || "Cliente",
      bill_to_last_name: lastName || "General",
      bill_to_email: email,
      order_id: orderId || `ORD-${Date.now()}`,
      description: `Pago en Machote - Orden ${orderId}`,
      // IMPORTANTE: Cambia estas URL por las de tu frontend
      redirect_url: "https://machoteprincipal.onrender.com/?status=success", 
      cancel_url: "https://machoteprincipal.onrender.com/?status=cancel"
    };

    // 5. Enviar a TiloPay
    const response = await axios.post(
      'https://app.tilopay.com/api/v1/process',
      payload,
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 6. Responder al Frontend con el enlace
    if (response.data && response.data.url) {
      res.json({ url: response.data.url });
    } else {
      res.status(500).json({ message: "TiloPay no devolvió un enlace" });
    }

  } catch (error) {
    console.error("❌ Error TiloPay:", error.response?.data || error.message);
    res.status(500).json({ message: "Error al conectar con la pasarela" });
  }
});

export default router;