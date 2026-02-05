import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos } = req.body;
    
    // Credenciales
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    // Iniciamos con el usuario como ID temporal (luego lo cambiaremos si encontramos uno mejor)
    let KEY_ID = API_USER; 

    console.log(`🔐 INICIANDO LOGIN para: ${API_USER}`);

    if (!API_USER || !API_PASSWORD) {
      return res.status(500).json({ message: "Faltan credenciales en Render." });
    }

    // --- PASO 1: LOGIN ---
    let token = "";
    try {
      const loginResponse = await axios.post('https://app.tilopay.com/api/v1/login', {
        apiuser: API_USER,
        password: API_PASSWORD
      });

      const data = loginResponse.data;
      token = data.access_token || data.token || data;
      console.log("✅ LOGIN EXITOSO. Token recibido.");

      // --- PASO 2: EL DECODIFICADOR (¡AQUÍ ESTÁ LA MAGIA!) ---
      // Vamos a leer qué hay adentro del Token para encontrar tu ID real
      try {
        if (token && token.includes('.')) {
          const payloadBase64 = token.split('.')[1];
          const decodedJson = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
          
          console.log("🔓 DATOS OCULTOS DENTRO DEL TOKEN:", JSON.stringify(decodedJson, null, 2));

          // Buscamos el ID en los campos donde TiloPay suele esconderlo
          const realId = decodedJson.user_id || decodedJson.merchant_id || decodedJson.sub || decodedJson.id;
          
          if (realId) {
            console.log(`🎯 ¡EUREKA! Tu ID Real es: ${realId}`);
            KEY_ID = realId; // ¡Usamos este!
          }
        }
      } catch (decodeError) {
        console.warn("⚠️ No se pudo decodificar el token, usaremos el ID de usuario.");
      }

    } catch (loginError) {
      console.error("❌ Falló Login:", loginError.response?.data);
      return res.status(401).json({ message: "Error Login", detalle: loginError.response?.data });
    }

    // --- PASO 3: INTENTO DE PAGO ---
    const orderRef = `ORD-${Date.now()}`; 
    const fullName = cliente?.nombre || "Cliente";
    const nameParts = fullName.split(" ");

    const payload = {
      key: KEY_ID, // Usamos el ID que sacamos del token
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

    console.log(`📡 Creando pago con TIENDA ID: ${KEY_ID}`);
    
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