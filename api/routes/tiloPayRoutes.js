import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos } = req.body;
    
    // --- 1. CREDENCIALES ---
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const KEY_ID = process.env.TILOPAY_API_KEY?.trim(); // <--- AHORA USAMOS ESTO PARA LA TIENDA
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    console.log(`🔐 Procesando para usuario: ${API_USER}`);

    if (!API_USER || !API_PASSWORD || !KEY_ID) {
      return res.status(500).json({ message: "Faltan credenciales en Render." });
    }

    // --- 2. LOGIN (Obtener Token) ---
    let token = "";
    try {
      console.log("📡 1. Solicitando Token (Login)...");
      const loginResponse = await axios.post('https://app.tilopay.com/api/v1/login', {
        apiuser: API_USER,
        password: API_PASSWORD
      });
      token = loginResponse.data.access_token || loginResponse.data.token || loginResponse.data;
      console.log("✅ Token recibido correctamente.");
    } catch (loginError) {
      console.error("❌ Falló Login:", loginError.response?.data || loginError.message);
      return res.status(401).json({ message: "Error de autenticación", detalle: loginError.response?.data });
    }

    // --- 3. CREAR ENLACE ---
    const orderRef = `ORD-${Date.now()}`; 
    const fullName = cliente?.nombre || "Cliente";
    const nameParts = fullName.split(" ");

    const payload = {
      key: KEY_ID, // <--- AQUÍ USAMOS LA LLAVE LARGA
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

    console.log(`📡 2. Creando pago para tienda: ${KEY_ID.substring(0,5)}...`);
    
    // Intentamos en APP (misma URL del login)
    try {
        const linkResponse = await axios.post('https://app.tilopay.com/api/v1/process', payload, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } 
        });
        console.log("✅ LINK GENERADO:", linkResponse.data.url);
        return res.json({ url: linkResponse.data.url });
    } catch (appError) {
        // Si falla app.tilopay, probamos api.tilopay (A veces el process está en otro server)
        console.warn("⚠️ Falló app.tilopay, probando api.tilopay...");
        const linkResponseBackup = await axios.post('https://api.tilopay.com/api/v1/process', payload, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } 
        });
        console.log("✅ LINK GENERADO (Backup):", linkResponseBackup.data.url);
        return res.json({ url: linkResponseBackup.data.url });
    }

  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error("❌ Error Final:", JSON.stringify(errorData, null, 2));
    res.status(500).json({ message: "Error al generar el pago", detalle: errorData });
  }
});

export default router;