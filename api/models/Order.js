import mongoose from 'express';

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true }, // Ej: ORD-17562...
  
  customer: {
    name: String,
    email: String,
    // Aquí puedes agregar teléfono o dirección si la pides luego
  },

  items: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      size: String,
      color: String,
      quantity: { type: Number, default: 1 },
      price: Number,
      image: String // Guardamos la foto para que la reconozcas rápido
    }
  ],

  total: Number,
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'sent', 'cancelled'], 
    default: 'pending' // Todo nace como "Pendiente"
  },

}, { timestamps: true }); // Guarda la hora de creación automáticamente

export default mongoose.model('Order', orderSchema);