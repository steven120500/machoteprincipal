import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    console.log("📥 Recibiendo petición de pago...");
    console.log("Datos recibidos:", req.body); // 👈 ESTO TE DIRÁ POR QUÉ FALLA EL FRONTEND

    const { amount, orderId, firstName, lastName, email } = req.body;

    // 1. Validación estricta
    if (!amount || !email) {
      console.error("❌ RECHAZADO: Faltan datos (monto o email)");
      return res.status(400).json({ message: "Faltan datos obligatorios (monto o email)" });
    }

    // 2. Cargar y LIMPIAR credenciales (El .trim() borra los espacios fantasma)
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const KEY_ID = process.env.TILOPAY_API_KEY?.trim(); 
    
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    // Debug de seguridad (Sin mostrar contraseñas completas)
    console.log("🔐 Credenciales procesadas:");
    console.log(`- User: ${API_USER ? 'OK' : 'FALTA'}`);
    console.log(`- Key ID: '${KEY_ID}'`); // Verifica en el log si esto se ve correcto

    if (!API_USER || !API_PASSWORD || !KEY_ID) {
      return res.status(500).json({ message: "Error de configuración: Faltan credenciales en Render." });
    }

    // 3. Autenticación
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
      redirect_url: `${FRONTEND}/checkout?status=success`,
      cancel_url: `${FRONTEND}/checkout?status=cancel`
    };

    // --- ESTRATEGIA DE DOBLE INTENTO ---
    
    // Intento A: API Moderna
    try {
      console.log("📡 Intentando conectar a: api.tilopay.com...");
      const response = await axios.post(
        'https://api.tilopay.com/api/v1/process',
        payload,
        { headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' } }
      );
      console.log("✅ Éxito (API Moderna):", response.data.url);
      return res.json({ url: response.data.url });

    } catch (apiError) {
      console.warn(`⚠️ Falló API Moderna (${apiError.response?.status}). Probando Legacy...`);
      
      // Intento B: API Legacy (Por si tu cuenta es antigua o diferente)
      try {
        const responseBackup = await axios.post(
          'https://app.tilopay.com/api/v1/process',
          payload,
          { headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' } }
        );
        console.log("✅ Éxito (API Legacy):", responseBackup.data.url);
        return res.json({ url: responseBackup.data.url });

      } catch (appError) {
        // Si fallan las dos, analizamos el error final
        const errorData = appError.response?.data || {};
        console.error("❌ ERROR FINAL TILOPAY:", JSON.stringify(errorData, null, 2));

        if (JSON.stringify(errorData).includes('"code":8')) {
          return res.status(500).json({ 
             message: "Credenciales rechazadas por TiloPay. Verifica tu KEY ID.",
             detalle: "Error Code 8: Merchant Not Found"
          });
        }
        
        throw appError;
      }
    }

  } catch (error) {
    console.error("❌ Error General:", error.message);
    res.status(500).json({ 
      message: "Error al conectar con la pasarela",
      detalle: error.response?.data || error.message
    });
  }
});

export default router;