import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos } = req.body;
    
    // Mapeo de datos
    const amount = total; 
    const email = cliente?.correo;
    const fullName = cliente?.nombre || "Cliente";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "General";

    // 1. CREDENCIALES (Tal cual las tienes ahora en Render)
    // TILOPAY_USER = "aq7i1C" (El corto)
    // TILOPAY_PASSWORD = "76aect..." (La contraseña)
    // TILOPAY_API_KEY = "5400-8203..." (La Larga, ¡déjala así!)
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const KEY_ID = process.env.TILOPAY_API_KEY?.trim(); 
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    console.log("🔐 Credenciales:");
    console.log(`- User: ${API_USER}`);
    console.log(`- Key: ${KEY_ID?.substring(0, 5)}... (Largo: ${KEY_ID?.length})`);

    if (!API_USER || !API_PASSWORD || !KEY_ID) {
      return res.status(500).json({ message: "Faltan credenciales en Render." });
    }

    // 2. PAYLOAD BLINDADO 🛡️
    const authString = Buffer.from(`${API_USER}:${API_PASSWORD}`).toString('base64');
    const orderRef = `ORD-${Date.now()}`; 

    const payload = {
      // TRUCO DE ORO: Enviamos las dos variantes para asegurar compatibilidad
      key: KEY_ID,      
      key_id: KEY_ID,   
      apiuser: API_USER, // 👈 ESTO ES LO QUE FALTABA (A veces TiloPay lo exige en el cuerpo)
      
      amount: amount,
      currency: "CRC",
      bill_to_first_name: firstName,
      bill_to_last_name: lastName,
      bill_to_email: email,
      order_id: orderRef,
      description: `Compra FutStore - ${productos?.length || 1} items`,
      redirect_url: `${FRONTEND}/checkout?status=success`,
      cancel_url: `${FRONTEND}/checkout?status=cancel`
    };

    // 3. INTENTO DE CONEXIÓN
    // Probamos primero app.tilopay.com que suele ser más estable para cuentas "Api"
    console.log("📡 Conectando a app.tilopay.com...");

    try {
      const response = await axios.post(
        'https://app.tilopay.com/api/v1/process', 
        payload,
        { headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' } }
      );
      
      console.log("✅ ¡LINK GENERADO!", response.data.url);
      return res.json({ url: response.data.url });

    } catch (error) {
      // Si falla, intentamos api.tilopay.com
      console.warn(`⚠️ Falló app.tilopay.com (${error.response?.status}). Probando api.tilopay.com...`);
      
      try {
        const responseBackup = await axios.post(
          'https://api.tilopay.com/api/v1/process',
          payload,
          { headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' } }
        );
        console.log("✅ ¡LINK GENERADO (Backup)!", responseBackup.data.url);
        return res.json({ url: responseBackup.data.url });

      } catch (finalError) {
        const errData = finalError.response?.data || {};
        console.error("❌ ERROR FINAL TILOPAY:", JSON.stringify(errData, null, 2));
        
        res.status(500).json({ 
          message: "Error conectando con TiloPay", 
          detalle: errData 
        });
      }
    }

  } catch (error) {
    console.error("❌ Error Servidor:", error.message);
    res.status(500).json({ message: "Error interno" });
  }
});

export default router;