import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos } = req.body;
    
    // --- 1. CREDENCIALES (Desde Render) ---
    // Asegúrate de tener en Render los datos de la CUENTA NUEVA:
    // TILOPAY_USER: "nlhoKf" (Tu usuario corto)
    // TILOPAY_PASSWORD: (Tu contraseña api)
    // TILOPAY_API_KEY: (Aquí puedes dejar la larga 5929... o la corta, no importa, usaremos User/Pass)
    
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    console.log(`🔐 Iniciando proceso para usuario: ${API_USER}`);

    if (!API_USER || !API_PASSWORD) {
      return res.status(500).json({ message: "Faltan credenciales en Render." });
    }

    // --- 2. PASO 1: LOGIN (Obtener Token) ---
    // Según la documentación que me pasaste
    let token = "";
    try {
      console.log("📡 1. Solicitando Token de acceso (Login)...");
      const loginResponse = await axios.post('https://app.tilopay.com/api/v1/login', {
        apiuser: API_USER,
        password: API_PASSWORD
      });

      // A veces el token viene en 'access_token' o dentro de 'data'
      token = loginResponse.data.access_token || loginResponse.data.token || loginResponse.data;
      console.log("✅ Token recibido correctamente.");

    } catch (loginError) {
      console.error("❌ Falló el Login:", loginError.response?.data || loginError.message);
      return res.status(401).json({ message: "Error de autenticación con TiloPay", detalle: loginError.response?.data });
    }

    // --- 3. PASO 2: CREAR ENLACE ---
    const orderRef = `ORD-${Date.now()}`; 
    const fullName = cliente?.nombre || "Cliente";
    const nameParts = fullName.split(" ");

    const payload = {
      key: API_USER, // Usamos el usuario como Key
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

    console.log("📡 2. Creando enlace de pago...");
    
    // Usamos el Token en los Headers (Bearer Auth)
    const linkResponse = await axios.post(
      'https://app.tilopay.com/api/v1/process',
      payload,
      { 
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        } 
      }
    );

    console.log("✅ ¡LINK GENERADO EXITOSAMENTE!", linkResponse.data.url);
    return res.json({ url: linkResponse.data.url });

  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error("❌ Error Final:", JSON.stringify(errorData, null, 2));
    
    res.status(500).json({ 
      message: "Error al generar el pago", 
      detalle: errorData 
    });
  }
});

export default router;