import express from 'express';
import axios from 'axios';

const router = express.Router();

// Credenciales desde variables de entorno
const TILO_USER = process.env.TILOPAY_USER;
const TILO_PASSWORD = process.env.TILOPAY_PASSWORD;
const TILO_API_KEY = process.env.TILOPAY_API_KEY;
// URL base de TiloPay (Cambiar a producción cuando te den luz verde)
const TILO_API_URL = 'https://app.tilopay.com/api/v1'; 

router.post('/create-link', async (req, res) => {
  try {
    const { cliente, productos, envio, total } = req.body;
    
    // Generar ID de orden único (Ej: FUT-1738492000)
    const orderId = `FUT-${Math.floor(Date.now() / 1000)}`;

    // 1. AUTENTICACIÓN: Obtener Token
    const authResponse = await axios.post(`${TILO_API_URL}/login`, {
      apiuser: TILO_USER,
      password: TILO_PASSWORD,
      apikey: TILO_API_KEY
    });

    // Dependiendo de la versión de TiloPay, el token viene en headers o body.
    // Usualmente es 'Authorization' en el header de respuesta o access_token en el body.
    let token = authResponse.headers['authorization'];
    
    if (!token && authResponse.data.access_token) {
        token = `Bearer ${authResponse.data.access_token}`;
    }

    if (!token) {
        throw new Error("No se pudo obtener el token de autenticación de TiloPay");
    }

    // 2. CREAR LINK DE PAGO
    const linkResponse = await axios.post(`${TILO_API_URL}/payment-links`, {
      amount: total,
      currency: "CRC",
      order_number: orderId,
      description: `Compra FutStore - ${productos.length} items`,
      client: cliente.nombre,
      email: cliente.correo, // Importante para TiloPay
      phone: cliente.telefono,
      address: cliente.direccion,
      // URLs a donde vuelve el usuario después de pagar
      success_url: `${process.env.FRONTEND_URL}/pago-exitoso`, 
      error_url: `${process.env.FRONTEND_URL}/checkout?error=true`,
      // callback_url: "..." // Opcional: para recibir confirmación en segundo plano
    }, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // 3. RESPONDER AL FRONTEND
    if (linkResponse.data && linkResponse.data.url) {
      res.json({ url: linkResponse.data.url });
    } else {
      console.error("Respuesta TiloPay:", linkResponse.data);
      res.status(500).json({ message: "TiloPay no devolvió una URL válida" });
    }

  } catch (error) {
    console.error("❌ Error TiloPay:", error.response?.data || error.message);
    res.status(500).json({ 
      message: "Error al generar el pago", 
      details: error.response?.data || error.message 
    });
  }
});

export default router;