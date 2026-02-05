import mongoose from 'mongoose'; // 👈 ¡AQUÍ ESTABA EL ERROR! (Debe decir 'mongoose', no 'express')

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true }, 
  
  customer: {
    name: String,
    email: String,
  },

  items: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      size: String,
      color: String,
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