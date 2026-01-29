import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    console.log("📥 [TiloPay] Recibiendo petición...");

    // 1. EXTRAER DATOS (ADAPTADO A TU FRONTEND)
    // Tu frontend envía: { cliente: {...}, total: 18500, productos: [...] }
    const { cliente, total, productos } = req.body;

    // Mapeamos los datos de tu estructura a la que necesita TiloPay
    const amount = total; 
    const email = cliente?.correo;
    const fullName = cliente?.nombre || "Cliente";
    
    // Separar nombre y apellido (opcional, pero TiloPay lo prefiere separado)
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "General";

    // DEBUG: Ver si ahora sí leemos los datos
    console.log(`📊 Datos procesados: Monto=${amount}, Email=${email}`);

    // 2. VALIDACIÓN
    if (!amount || !email) {
      console.error("❌ RECHAZADO: Faltan datos obligatorios.");
      console.error("Recibido:", req.body); // Para ver qué llegó si falla
      return res.status(400).json({ message: "Faltan datos obligatorios (monto o email)" });
    }

    // 3. CREDENCIALES (Con .trim para seguridad)
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const KEY_ID = process.env.TILOPAY_API_KEY?.trim(); 
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    if (!API_USER || !API_PASSWORD || !KEY_ID) {
      return res.status(500).json({ message: "Error interno: Faltan credenciales en Render." });
    }

    // 4. PREPARAR PAYLOAD PARA TILOPAY
    const authString = Buffer.from(`${API_USER}:${API_PASSWORD}`).toString('base64');
    
    // Generar ID de orden único
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
      
      // URLs de retorno
      redirect_url: `${FRONTEND}/checkout?status=success`,
      cancel_url: `${FRONTEND}/checkout?status=cancel`
    };

    // 5. INTENTO DE CONEXIÓN (DOBLE ESTRATEGIA)
    
    // ESTRATEGIA A: API Moderna (api.tilopay.com)
    try {
      console.log("📡 Conectando a api.tilopay.com...");
      const response = await axios.post(
        'https://api.tilopay.com/api/v1/process',
        payload,
        { headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' } }
      );
      console.log("✅ LINK CREADO:", response.data.url);
      return res.json({ url: response.data.url });

    } catch (apiError) {
      console.warn(`⚠️ Falló API Moderna (${apiError.response?.status}). Intentando Legacy...`);

      // ESTRATEGIA B: API Legacy (app.tilopay.com) - Por si acaso
      try {
        const responseBackup = await axios.post(
          'https://app.tilopay.com/api/v1/process',
          payload,
          { headers: { 'Authorization': `Basic ${authString}`, 'Content-Type': 'application/json' } }
        );
        console.log("✅ LINK CREADO (Legacy):", responseBackup.data.url);
        return res.json({ url: responseBackup.data.url });

      } catch (appError) {
        // ERROR FINAL
        const errorData = appError.response?.data || {};
        console.error("❌ ERROR TILOPAY FINAL:", JSON.stringify(errorData, null, 2));

        // Pista si sale el Code 8 (Credenciales Malas)
        if (JSON.stringify(errorData).includes('"code":8')) {
          return res.status(500).json({ 
             message: "Error de Credenciales (Code 8). Revisa el KEY ID en Render.",
             detalle: "El comercio no existe o el ID está mal escrito."
          });
        }
        
        return res.status(500).json({ 
          message: "No se pudo conectar con TiloPay",
          detalle: errorData
        });
      }
    }

  } catch (error) {
    console.error("❌ Error General Servidor:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;