import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos } = req.body;
    
    // 1. CREDENCIALES
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const API_KEY = process.env.TILOPAY_API_KEY?.trim(); // Aquí va la LLAVE LARGA
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    console.log(`🚀 INICIANDO PAGO (ENDPOINT CORRECTO: processPayment)`);

    if (!API_USER || !API_PASSWORD || !API_KEY) {
      return res.status(500).json({ message: "Faltan credenciales en Render." });
    }

    // 2. LOGIN (Obtener Token) - ESTO YA FUNCIONA
    let token = "";
    try {
      const loginResponse = await axios.post('https://app.tilopay.com/api/v1/login', {
        apiuser: API_USER,
        password: API_PASSWORD
      });
      token = loginResponse.data.access_token || loginResponse.data.token || loginResponse.data;
      console.log("✅ Token obtenido.");
    } catch (e) { return res.status(401).json({message: "Error Login"}); }

    // 3. CREAR PAGO (Configuración según tu documentación)
    const orderRef = `ORD-${Date.now()}`; 
    const fullName = cliente?.nombre || "Cliente General";
    // Separamos nombre y apellido porque TiloPay los pide aparte
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "Cliente";

    const payload = {
      // Campos obligatorios según tu captura de Postman
      key: API_KEY, // La llave larga
      amount: total,
      currency: "CRC",
      redirect: `${FRONTEND}/checkout?status=success`, // Según docs se llama 'redirect'
      
      // Datos del Cliente (Formato CamelCase como en la foto)
      billToFirstName: firstName,
      billToLastName: lastName,
      billToEmail: cliente?.correo || "cliente@email.com",
      billToTelephone: "88888888", // Dato obligatorio, ponemos uno default si no hay
      billToAddress: "San Jose, Costa Rica", // Dato obligatorio
      billToCity: "San Jose", // Dato obligatorio
      billToState: "San Jose", // Dato obligatorio
      billToZipPostCode: "10101", // Dato obligatorio
      billToCountry: "CR", // Dato obligatorio (ISO código de Costa Rica)
      
      // Extras
      orderNumber: orderRef,
      description: `Compra FutStore - ${productos?.length || 1} items`
    };

    console.log(`📡 Enviando a /processPayment con Key: ${API_KEY.substring(0,5)}...`);
    
    try {
        // CAMBIO CRUCIAL: La URL exacta de tu captura
        const linkResponse = await axios.post('https://app.tilopay.com/api/v1/processPayment', payload, { 
            headers: { 
              'Authorization': `Bearer ${token}`, 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            } 
        });
        
        console.log("✅ RESPUESTA TILOPAY:", JSON.stringify(linkResponse.data));
        
        // Según docs, devuelve { url: "..." }
        return res.json({ url: linkResponse.data.url });

    } catch (appError) {
        console.error("❌ Error TiloPay:", JSON.stringify(appError.response?.data || appError.message));
        res.status(500).json({ message: "Error TiloPay", detalle: appError.response?.data });
    }

  } catch (error) {
    res.status(500).json({ message: "Error interno" });
  }
});

export default router;