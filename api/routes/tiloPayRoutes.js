import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos } = req.body;
    
    // Credenciales
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const API_KEY = process.env.TILOPAY_API_KEY?.trim(); // Aquí usaremos la LLAVE LARGA
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    console.log(`🚀 INICIANDO PAGO (VERSIÓN MODERNA)`);
    console.log(`👤 Usuario: ${API_USER}`);

    if (!API_USER || !API_PASSWORD || !API_KEY) {
      return res.status(500).json({ message: "Faltan credenciales en Render." });
    }

    // --- PASO 1: LOGIN (Token) ---
    let token = "";
    try {
      const loginResponse = await axios.post('https://app.tilopay.com/api/v1/login', {
        apiuser: API_USER,
        password: API_PASSWORD
      });
      token = loginResponse.data.access_token || loginResponse.data.token || loginResponse.data;
      console.log("✅ Token obtenido correctamente.");
    } catch (loginError) {
      console.error("❌ Falló Login:", loginError.response?.data);
      return res.status(401).json({ message: "Error Login", detalle: loginError.response?.data });
    }

    // --- PASO 2: CREAR LINK (URL NUEVA) ---
    const orderRef = `ORD-${Date.now()}`; 
    const fullName = cliente?.nombre || "Cliente";
    const nameParts = fullName.split(" ");

    // En la versión nueva, a veces piden 'apiuser' en el cuerpo en lugar de 'key'
    const payload = {
      apiuser: API_USER,  // <--- IMPORTANTE: Tu usuario corto
      key: API_KEY,       // <--- Tu llave larga
      amount: total,
      currency: "CRC",
      bill_to_first_name: nameParts[0],
      bill_to_last_name: nameParts.slice(1).join(" ") || "General",
      bill_to_email: cliente?.correo,
      order_id: orderRef,
      description: `Compra FutStore - ${productos?.length || 1} items`,
      callback_url: `${FRONTEND}/checkout?status=success`, // A veces se llama callback_url
      redirect_url: `${FRONTEND}/checkout?status=success`,
      cancel_url: `${FRONTEND}/checkout?status=cancel`
    };

    console.log(`📡 Enviando a /payment-link...`);
    
    try {
        // CAMBIO DE URL: Usamos payment-link en vez de process
        const linkResponse = await axios.post('https://app.tilopay.com/api/v1/payment-link', payload, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } 
        });
        
        // La respuesta puede venir en .url o .link
        const finalUrl = linkResponse.data.url || linkResponse.data.link || linkResponse.data.payment_link;
        console.log("✅ ¡LINK NUEVO GENERADO!:", finalUrl);
        return res.json({ url: finalUrl });

    } catch (appError) {
        // Si falla, imprimimos el error detallado
        console.error("❌ Error TiloPay:", JSON.stringify(appError.response?.data || appError.message));
        res.status(500).json({ message: "Error TiloPay", detalle: appError.response?.data });
    }

  } catch (error) {
    console.error("❌ Error General:", error.message);
    res.status(500).json({ message: "Error interno" });
  }
});

export default router;