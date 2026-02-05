import express from 'express';
import axios from 'axios';
import Order from '../models/Order.js'; 
import Product from '../models/Product.js'; // 👈 IMPORTANTE: Necesario para restar el inventario

const router = express.Router();

// --- RUTA 1: CREAR LINK DE PAGO (Y guardar pedido pendiente) ---
router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos } = req.body;
    
    // 1. CREDENCIALES
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const API_KEY = process.env.TILOPAY_API_KEY?.trim(); 
    const FRONTEND = process.env.FRONTEND_URL || "https://machote.onrender.com";

    // 2. GENERAR ID ÚNICO
    const orderRef = `ORD-${Date.now()}`; 

    // 3. GUARDAR EN BASE DE DATOS (PENDIENTE)
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
                image: prod.imgs ? prod.imgs[0] : "" 
            })),
            total: total,
            status: 'pending' // Nace pendiente
        });

        await newOrder.save();
        console.log(`📝 Pedido ${orderRef} guardado en MongoDB (Pendiente).`);

    } catch (dbError) {
        console.error("❌ Error guardando pedido:", dbError);
        return res.status(500).json({ message: "Error al crear el pedido en el sistema" });
    }

    // 4. LOGIN TILOPAY
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

    // 5. CREAR LINK DE PAGO
    const fullName = cliente?.nombre || "Cliente General";
    const nameParts = fullName.trim().split(" ");
    
    const payload = {
      key: API_KEY, 
      amount: total,
      currency: "CRC",
      // Redirigimos con el ID de la orden para poder confirmarla luego
      redirect: `${FRONTEND}/checkout?status=success&order=${orderRef}`, 
      
      billToFirstName: nameParts[0],
      billToLastName: nameParts.slice(1).join(" ") || "Cliente",
      billToEmail: cliente?.correo || "cliente@email.com",
      billToTelephone: "88888888",
      billToAddress: "San Jose",
      billToCity: "San Jose",
      billToState: "San Jose",
      billToZipPostCode: "10101",
      billToCountry: "CR",
      
      orderNumber: orderRef, 
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
        
        console.log("✅ Link generado:", orderRef);
        return res.json({ url: linkResponse.data.url });

    } catch (appError) {
        console.error("❌ Error TiloPay:", JSON.stringify(appError.response?.data));
        res.status(500).json({ message: "Error TiloPay", detalle: appError.response?.data });
    }

  } catch (error) {
    res.status(500).json({ message: "Error interno" });
  }
});

// --- RUTA 2: CONFIRMAR PAGO Y RESTAR STOCK (NUEVA) ---
router.post('/confirm-payment', async (req, res) => {
  try {
    const { orderId } = req.body;

    console.log(`🔄 Intentando confirmar orden: ${orderId}`);

    // 1. Buscar la orden
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });

    // 2. Si ya estaba pagada, no hacemos nada (evita restar stock doble)
    if (order.status === 'paid') {
      console.log(`⚠️ Orden ${orderId} ya estaba pagada.`);
      return res.json({ message: "Orden ya procesada anteriormente", status: 'paid' });
    }

    // 3. RESTAR STOCK DE CADA PRODUCTO
    for (const item of order.items) {
      if (item.product_id) {
        const product = await Product.findById(item.product_id);
        
        if (product) {
          // Normalizamos la talla (por si viene en minúscula/mayúscula)
          const sizeKey = item.size; 
          const currentStock = parseInt(product.stock[sizeKey] || 0);
          const qtyToDeduct = item.quantity;

          // Restamos asegurando que no baje de 0
          if (product.stock[sizeKey] !== undefined) {
             product.stock[sizeKey] = Math.max(0, currentStock - qtyToDeduct);
             await product.save();
             console.log(`📉 Stock bajado: ${product.name} [${sizeKey}] -> Quedan: ${product.stock[sizeKey]}`);
          }
        }
      }
    }

    // 4. Marcar orden como PAGADA
    order.status = 'paid';
    await order.save();

    console.log(`✅ ¡ÉXITO! Orden ${orderId} confirmada y stock actualizado.`);
    res.json({ success: true, message: "Pago confirmado y stock actualizado" });

  } catch (error) {
    console.error("❌ Error confirmando pago:", error);
    res.status(500).json({ message: "Error interno al confirmar" });
  }
});

export default router;