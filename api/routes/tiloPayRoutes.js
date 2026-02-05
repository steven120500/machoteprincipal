import express from 'express';
import axios from 'axios';
import Order from '../models/Order.js'; // <--- 1. IMPORTAMOS EL MODELO

const router = express.Router();

router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos } = req.body;
    
    // --- 1. CREDENCIALES ---
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const API_KEY = process.env.TILOPAY_API_KEY?.trim(); 
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    // --- 2. GENERAR ID ÚNICO ---
    const orderRef = `ORD-${Date.now()}`; 

    // --- 3. GUARDAR EN BASE DE DATOS (PENDIENTE) ---
    // Esto es lo nuevo: Guardamos qué quiere comprar el cliente
    try {
        const newOrder = new Order({
            orderId: orderRef,
            customer: {
                name: cliente?.nombre || "Cliente",
                email: cliente?.correo || "sin_correo@email.com"
            },
            items: productos.map(prod => ({
                product_id: prod._id || prod.id, 
                name: prod.nombre || prod.title,
                size: prod.tallaSeleccionada || "Estándar",
                quantity: prod.cantidad || 1,
                price: prod.precio,
                image: prod.imgs ? prod.imgs[0] : "" // Guardamos la foto para referencia
            })),
            total: total,
            status: 'pending' // Nace pendiente
        });

        await newOrder.save();
        console.log(`📝 Pedido ${orderRef} guardado en MongoDB.`);

    } catch (dbError) {
        console.error("❌ Error guardando pedido:", dbError);
        return res.status(500).json({ message: "Error al crear el pedido en el sistema" });
    }

    // --- 4. LOGIN TILOPAY ---
    if (!API_USER || !API_PASSWORD || !API_KEY) {
      return res.status(500).json({ message: "Faltan credenciales" });
    }

    let token = "";
    try {
      const loginResponse = await axios.post('https://app.tilopay.com/api/v1/login', {
        apiuser: API_USER,
        password: API_PASSWORD
      });
      token = loginResponse.data.access_token || loginResponse.data.token || loginResponse.data;
    } catch (e) { return res.status(401).json({message: "Error Login TiloPay"}); }

    // --- 5. CREAR LINK DE PAGO ---
    const fullName = cliente?.nombre || "Cliente General";
    const nameParts = fullName.trim().split(" ");
    
    const payload = {
      key: API_KEY, 
      amount: total,
      currency: "CRC",
      redirect: `${FRONTEND}/checkout?status=success&order=${orderRef}`, // <--- Avisamos cuál orden es
      
      billToFirstName: nameParts[0],
      billToLastName: nameParts.slice(1).join(" ") || "Cliente",
      billToEmail: cliente?.correo || "cliente@email.com",
      billToTelephone: "88888888",
      billToAddress: "San Jose",
      billToCity: "San Jose",
      billToState: "San Jose",
      billToZipPostCode: "10101",
      billToCountry: "CR",
      
      orderNumber: orderRef, // <--- CONECTAMOS: El ID de TiloPay es igual al de MongoDB
      description: `Compra FutStore - ${productos?.length || 1} items`
    };
    
    try {
        const linkResponse = await axios.post('https://app.tilopay.com/api/v1/processPayment', payload, { 
            headers: { 
              'Authorization': `Bearer ${token}`, 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            } 
        });
        
        console.log("✅ Link generado para orden:", orderRef);
        return res.json({ url: linkResponse.data.url });

    } catch (appError) {
        console.error("❌ Error TiloPay:", JSON.stringify(appError.response?.data));
        res.status(500).json({ message: "Error TiloPay", detalle: appError.response?.data });
    }

  } catch (error) {
    res.status(500).json({ message: "Error interno" });
  }
});

export default router;