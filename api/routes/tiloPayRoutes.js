import express from 'express';
import axios from 'axios';
import Order from '../models/Order.js'; 
import Product from '../models/Product.js'; 

const router = express.Router();

// --- RUTA 1: CREAR LINK DE PAGO ---
router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos } = req.body;
    
    // Credenciales
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const API_KEY = process.env.TILOPAY_API_KEY?.trim(); 
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    const orderRef = `ORD-${Date.now()}`; 

    // --- GUARDAR DATOS COMPLETOS ---
    try {
        const newOrder = new Order({
            orderId: orderRef,
            customer: {
                name: cliente?.nombre || "Cliente",
                email: cliente?.correo || "sin_correo@email.com",
                phone: cliente?.telefono || "",       // 👈 GUARDAMOS TELÉFONO
                address: cliente?.direccion || ""     // 👈 GUARDAMOS DIRECCIÓN
            },
            items: productos.map(prod => ({
                product_id: prod._id || prod.id, 
                name: prod.nombre || prod.title,
                size: prod.tallaSeleccionada || "Estándar",
                type: prod.version || "",             // 👈 GUARDAMOS VERSIÓN
                quantity: prod.cantidad || 1,
                price: prod.precio,
                image: prod.imgs ? prod.imgs[0] : "" 
            })),
            total: total,
            status: 'pending' 
        });

        await newOrder.save();
        console.log(`📝 Pedido ${orderRef} guardado con datos completos.`);

    } catch (dbError) {
        console.error("❌ Error guardando pedido:", dbError);
        return res.status(500).json({ message: "Error al crear el pedido" });
    }

    // --- LOGIN TILOPAY ---
    if (!API_USER || !API_PASSWORD || !API_KEY) return res.status(500).json({ message: "Faltan credenciales" });

    let token = "";
    try {
      const loginResponse = await axios.post('https://app.tilopay.com/api/v1/login', {
        apiuser: API_USER,
        password: API_PASSWORD
      });
      token = loginResponse.data.access_token || loginResponse.data.token || loginResponse.data;
    } catch (e) { return res.status(401).json({message: "Error Login TiloPay"}); }

    // --- PAYLOAD TILOPAY ---
    const fullName = cliente?.nombre || "Cliente General";
    const nameParts = fullName.trim().split(" ");
    
    const payload = {
      key: API_KEY, 
      amount: total,
      currency: "CRC",
      redirect: `${FRONTEND}/checkout?status=success&order=${orderRef}`,
      
      billToFirstName: nameParts[0],
      billToLastName: nameParts.slice(1).join(" ") || "Cliente",
      billToEmail: cliente?.correo || "cliente@email.com",
      billToTelephone: cliente?.telefono || "88888888",
      billToAddress: cliente?.direccion || "San Jose", // Enviamos la dirección real a TiloPay también
      billToCity: "San Jose",
      billToState: "San Jose",
      billToZipPostCode: "10101",
      billToCountry: "CR",
      
      orderNumber: orderRef, 
      description: `Compra FutStore - ${productos?.length || 1} items`
    };
    
    try {
        const linkResponse = await axios.post('https://app.tilopay.com/api/v1/processPayment', payload, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } 
        });
        return res.json({ url: linkResponse.data.url });
    } catch (appError) {
        res.status(500).json({ message: "Error TiloPay", detalle: appError.response?.data });
    }
  } catch (error) { res.status(500).json({ message: "Error interno" }); }
});

// --- RUTA 2: CONFIRMAR PAGO (Igual que antes) ---
router.post('/confirm-payment', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });

    if (order.status === 'paid') return res.json({ message: "Ya procesada", status: 'paid' });

    for (const item of order.items) {
      if (item.product_id) {
        const product = await Product.findById(item.product_id);
        if (product && product.stock[item.size] !== undefined) {
             product.stock[item.size] = Math.max(0, parseInt(product.stock[item.size] || 0) - item.quantity);
             await product.save();
        }
      }
    }
    order.status = 'paid';
    await order.save();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ message: "Error" }); }
});

export default router;