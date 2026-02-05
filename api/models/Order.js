import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  
  customer: {
    name: String,
    email: String,
    phone: String,      // 👈 NUEVO: Teléfono
    address: String     // 👈 NUEVO: Dirección Completa
  },

  items: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      size: String,
      color: String,
      type: String,     // 👈 NUEVO: Versión (Jugador/Fan/Retro)
      quantity: { type: Number, default: 1 },
      price: Number,
      image: String 
    }
  ],

  total: Number,
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'sent', 'cancelled'], 
    default: 'pending'
  },
  
  tiloPayToken: String

}, { timestamps: true });

export default mongoose.model('Order', orderSchema);