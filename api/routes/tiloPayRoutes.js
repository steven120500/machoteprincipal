import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos } = req.body;
    
    // Mapeo de datos (Ya vimos que esto funciona bien)
    const amount = total; 
    const email = cliente?.correo;
    const fullName = cliente?.nombre || "Cliente";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "General";

    // 1. CREDENCIALES
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const KEY_ID = process.env.TILOPAY_API_KEY?.trim(); 
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    // --- DIAGNÓSTICO DE CREDENCIALES (Mira esto en los logs) ---
    console.log("🔍 REVISIÓN DE LLAVES:");
    if (KEY_ID && KEY_ID.length > 20) {
      console.warn("⚠️ ALERTA: Tu Key ID es muy largo (" + KEY_ID.length + " letras).");
      console.warn("   ¿Seguro que no pusiste la Contraseña en el campo de Key ID?");
      console.warn("   El Key ID suele ser un número corto (ej: 1543) o una palabra.");
    } else {
      console.log("✅ El Key ID tiene un tamaño normal.");
    }

    if (!API_USER || !API_PASSWORD || !KEY_ID) {
      return res.status(500).json({ message: "Faltan credenciales en Render." });
    }

    // 2. PAYLOAD
    const authString = Buffer.from(`${API_USER}:${API_PASSWORD}`).toString('base64');
    const orderRef = `ORD-${Date.now()}`; 

    const payload = {
      key_id: KEY_ID,
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

    // 3. INTENTO TRIPLE (Producción -> Legacy -> Sandbox)
    
    // URLS POSIBLES
    const urls = [
      'https://api.tilopay.com/api/v1/process',      // Opción A: API Nueva
      'https://app.tilopay.com/api/v1/process',      // Opción B: API Legacy
      'https://sandbox.tilopay.com/api/v1/process'   // Opción C: Modo Pruebas
    ];

    let lastError = null;

    // Probamos las 3 URLs una por una hasta que una funcione
    for (const url of urls) {
      try {
        console.log(`📡 Probando conexión con: ${url} ...`);
        const response = await axios.post(url, payload, {
          headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' }
        });
        
        if (response.data && response.data.url) {
          console.log("✅ ¡CONEXIÓN EXITOSA! Link generado:", response.data.url);
          return res.json({ url: response.data.url }); // ¡ÉXITO!
        }
      } catch (error) {
        console.warn(`❌ Falló ${url} (Status: ${error.response?.status})`);
        lastError = error;
        // Si falla, el ciclo 'for' continuará con la siguiente URL automáticamente
      }
    }

    // Si llegamos aquí, fallaron las 3 URLs
    const errorData = lastError?.response?.data || {};
    console.error("🔥 TODAS LAS CONEXIONES FALLARON. Último error:", JSON.stringify(errorData, null, 2));

    res.status(500).json({ 
      message: "Error de Credenciales o Configuración",
      detalle: "Revisa en los logs si tu Key ID es correcto. TiloPay rechazó la conexión."
    });

  } catch (error) {
    console.error("❌ Error Crítico:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;