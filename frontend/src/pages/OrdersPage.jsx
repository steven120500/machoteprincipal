import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Asegúrate de que esta URL coincida con tu backend
const API_URL = import.meta.env.VITE_API_URL || 'https://machoteprincipal.onrender.com/api';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders`);
      setOrders(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-500 text-black'; // Pagado = Verde
      case 'pending': return 'bg-yellow-500 text-black'; // Pendiente = Amarillo
      case 'cancelled': return 'bg-red-500 text-white'; // Cancelado = Rojo
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#D4AF37] border-b border-[#D4AF37] pb-4">
          📦 Panel de Pedidos
        </h1>

        {loading ? (
          <p className="text-center text-gray-400">Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 bg-[#111] rounded-lg border border-gray-800">
            <p className="text-xl text-gray-400">No hay pedidos registrados aún.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-[#111] border border-gray-800 rounded-lg p-6 hover:border-[#D4AF37] transition-colors">
                
                {/* Cabecera del Pedido */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b border-gray-800 pb-4">
                  <div>
                    <span className="text-gray-400 text-sm">Orden ID:</span>
                    <p className="font-mono text-[#D4AF37] font-bold">{order.orderId}</p>
                    <p className="text-sm text-gray-300">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="mt-2 md:mt-0 text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                      {order.status === 'pending' ? 'Pendiente de Pago' : order.status}
                    </span>
                    <p className="text-xl font-bold mt-1">₡ {order.total?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Datos del Cliente */}
                <div className="mb-4">
                  <p className="text-sm text-gray-400">Cliente:</p>
                  <p className="font-semibold">{order.customer?.name}</p>
                  <p className="text-sm text-gray-400">{order.customer?.email}</p>
                </div>

                {/* Lista de Productos */}
                <div className="bg-black/50 rounded p-4">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Productos:</p>
                  <ul className="space-y-3">
                    {order.items?.map((item, index) => (
                      <li key={index} className="flex items-center gap-4">
                        {/* Miniatura si existe */}
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded border border-gray-700" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          <p className="text-xs text-gray-400">Talla: {item.size} | Cant: {item.quantity}</p>
                        </div>
                        <p className="text-sm text-[#D4AF37]">₡ {item.price?.toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;