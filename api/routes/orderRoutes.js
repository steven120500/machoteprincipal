import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// 1. OBTENER TODOS
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener pedidos" });
  }
});

// 2. ACTUALIZAR ESTADO
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error actualizando estado" });
  }
});

// 👇 3. ELIMINAR ORDEN (NUEVO)
router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Orden eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la orden" });
  }
});

export default router;