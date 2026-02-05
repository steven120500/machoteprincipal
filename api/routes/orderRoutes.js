import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// 1. OBTENER TODOS LOS PEDIDOS (Para tu panel de Admin)
router.get('/', async (req, res) => {
  try {
    // Los traemos ordenados: los más nuevos primero (-1)
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener pedidos" });
  }
});

// 2. ACTUALIZAR ESTADO (Para marcar como "Enviado" o "Pagado" manualmente)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error actualizando estado" });
  }
});

export default router;