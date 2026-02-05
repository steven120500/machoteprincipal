import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos } = req.body;
    
    // Leemos las credenciales
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    let KEY_ID = process.env.TILOPAY_API_KEY?.trim(); 
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    console.log(`🔐 INICIANDO PROCESO DETECTIVE 🕵️`);
    console.log(`- Usuario: ${API_USER}`);
    console.log(`- Llave actual en Render: ${KEY_ID}`);

    if (!API_USER || !API_PASSWORD) {
      return res.status(500).json({ message: "Faltan credenciales en Render." });
    }

    // --- PASO 1: LOGIN Y RASTREO ---
    let token = "";
    try {
      console.log("📡 Solicitando Token y Datos...");
      const loginResponse = await axios.post('https://app.tilopay.com/api/v1/login', {
        apiuser: API_USER,
        password: API_PASSWORD
      });

      const data = loginResponse.data;
      token = data.access_token || data.token || data;
      
      console.log("✅ LOGIN EXITOSO.");
      console.log("------------------------------------------------");
      console.log("🕵️ ¡AQUÍ ESTÁ TU VERDADERO ID DE COMERCIO! 👇");
      console.log(JSON.stringify(data, null, 2));
      console.log("------------------------------------------------");

      // Intentamos pescar el ID correcto automáticamente
      // TiloPay a veces lo devuelve como 'merchant_id'
      const detectedId = data.merchant_id || data.user_id || (data.user && data.user.id);
      
      if (detectedId) {
        console.log(`💡 EL CÓDIGO INTELIGENTE CAMBIÓ TU LLAVE POR: ${detectedId}`);
        KEY_ID = detectedId; 
      } else {
        console.log("⚠️ No se encontró ID obvio, usando el de Render.");
      }

    } catch (loginError) {
      console.error("❌ Falló Login:", loginError.response?.data);
      return res.status(401).json({ message: "Error Login", detalle: loginError.response?.data });
    }

    // --- PASO 2: INTENTO DE PAGO ---
    const orderRef = `ORD-${Date.now()}`; 
    const fullName = cliente?.nombre || "Cliente";
    const nameParts = fullName.split(" ");

    const payload = {
      key: KEY_ID, 
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

    console.log(`📡 Probando pago con TIENDA ID: ${KEY_ID}`);
    
    try {
        const linkResponse = await axios.post('https://app.tilopay.com/api/v1/process', payload, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } 
        });
        console.log("✅ ¡LINK CREADO!:", linkResponse.data.url);
        return res.json({ url: linkResponse.data.url });

    } catch (appError) {
        console.error("❌ Error al crear link:", JSON.stringify(appError.response?.data || appError.message));
        res.status(500).json({ message: "Error TiloPay", detalle: appError.response?.data });
    }

  } catch (error) {
    console.error("❌ Error General:", error.message);
    res.status(500).json({ message: "Error interno" });
  }
});

export default router;