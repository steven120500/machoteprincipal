import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos } = req.body;
    
    // 1. LEER VARIABLES (Sin "detectives", sin lógica extra)
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const KEY_ID = process.env.TILOPAY_API_KEY?.trim(); // Usará ESTRICTAMENTE lo que pongas en Render
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    console.log(`🔐 MODO OBEDIENTE ACTIVADO`);
    console.log(`👤 Usuario: ${API_USER}`);
    console.log(`🔑 Usando LLAVE FORZADA: ${KEY_ID?.substring(0, 10)}...`); 

    if (!API_USER || !API_PASSWORD || !KEY_ID) {
      return res.status(500).json({ message: "Faltan credenciales en Render." });
    }

    // 2. LOGIN (Solo para obtener el Token)
    let token = "";
    try {
      const loginResponse = await axios.post('https://app.tilopay.com/api/v1/login', {
        apiuser: API_USER,
        password: API_PASSWORD
      });
      token = loginResponse.data.access_token || loginResponse.data.token || loginResponse.data;
      console.log("✅ Token obtenido.");
    } catch (loginError) {
      console.error("❌ Falló Login:", loginError.response?.data);
      return res.status(401).json({ message: "Error Login", detalle: loginError.response?.data });
    }

    // 3. PAGO (Usando la llave que TÚ decidiste)
    const orderRef = `ORD-${Date.now()}`; 
    const fullName = cliente?.nombre || "Cliente";
    const nameParts = fullName.split(" ");

    const payload = {
      key: KEY_ID, // <--- Aquí va el 87e3af... sin que nadie lo cambie
      amount: total,
      currency: "CRC",
      bill_to_first_name: nameParts[0],
      bill_to_last_name: nameParts.slice(1).join(" ") || "General",
      bill_to_email: cliente?.correo,
      order_id: orderRef,
      description: `Compra FutStore - ${productos?.length || 1} items`,
      redirect_url: `${FRONTEND}/checkout?status=success`,
      cancel_url: `${FRONTEND}/checkout?status=cancel`
    };

    console.log(`📡 Enviando solicitud a TiloPay con KEY: ${KEY_ID}`);
    
    try {
        const linkResponse = await axios.post('https://app.tilopay.com/api/v1/process', payload, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } 
        });
        console.log("✅ ¡LINK CREADO!:", linkResponse.data.url);
        return res.json({ url: linkResponse.data.url });

    } catch (appError) {
        console.error("❌ Error TiloPay:", JSON.stringify(appError.response?.data || appError.message));
        res.status(500).json({ message: "Error TiloPay", detalle: appError.response?.data });
    }

  } catch (error) {
    console.error("❌ Error General:", error.message);
    res.status(500).json({ message: "Error interno" });
  }
});

export default router;