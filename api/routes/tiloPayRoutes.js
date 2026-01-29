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

    // 1. CREDENCIALES
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const KEY_ID = process.env.TILOPAY_API_KEY?.trim(); // Aquí vendrá la LLAVE LARGA (5400...)
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    // Debug
    console.log("🔐 Credenciales cargadas:");
    console.log(`- User: ${API_USER}`);
    console.log(`- Key (Longitud): ${KEY_ID?.length} caracteres`); // Debería ser 24 aprox

    if (!API_USER || !API_PASSWORD || !KEY_ID) {
      return res.status(500).json({ message: "Faltan credenciales en Render." });
    }

    // 2. PAYLOAD (AQUÍ ESTÁ LA CORRECCIÓN CLAVE 👇)
    const authString = Buffer.from(`${API_USER}:${API_PASSWORD}`).toString('base64');
    const orderRef = `ORD-${Date.now()}`; 

    const payload = {
      key: KEY_ID,   // 👈 ANTES DECÍA 'key_id'. AHORA ES 'key'. ¡ESTO ES VITAL!
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
    // Usamos api.tilopay.com que es la estándar para Prod
    const url = 'https://api.tilopay.com/api/v1/process';
    
    console.log(`📡 Conectando a TiloPay con KEY: ${KEY_ID.substring(0, 5)}...`);

    try {
      const response = await axios.post(url, payload, {
        headers: { 
          'Authorization': `Basic ${authString}`, 
          'Content-Type': 'application/json' 
        }
      });
      
      console.log("✅ ¡LINK GENERADO EXITOSAMENTE!", response.data.url);
      return res.json({ url: response.data.url });

    } catch (error) {
      // Si falla, intentamos con la URL alternativa (app.tilopay.com)
      console.warn("⚠️ Falló api.tilopay.com, probando app.tilopay.com...");
      try {
        const responseBackup = await axios.post('https://app.tilopay.com/api/v1/process', payload, {
          headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' }
        });
        console.log("✅ ¡LINK GENERADO (Backup)!", responseBackup.data.url);
        return res.json({ url: responseBackup.data.url });
      } catch (backupError) {
        console.error("❌ ERROR FINAL:", JSON.stringify(backupError.response?.data || backupError.message));
        res.status(500).json({ 
          message: "Error conectando con TiloPay", 
          detalle: backupError.response?.data 
        });
      }
    }

  } catch (error) {
    console.error("❌ Error Servidor:", error.message);
    res.status(500).json({ message: "Error interno" });
  }
});

export default router;