import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBoxOpen, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'https://machoteprincipal.onrender.com/api';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('paid'); // 'paid' o 'pending'

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

  // 👇 FILTRO MÁGICO: Solo mostramos lo que coincide con la pestaña
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'paid') {
      return order.status === 'paid' || order.status === 'sent'; // Ventas reales
    } else {
      return order.status === 'pending' || order.status === 'failed'; // Intentos fallidos/abandonados
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-500 text-black';
      case 'sent': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-yellow-500/50 text-white border border-yellow-500';
      case 'failed': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-[#D4AF37] border-b border-[#D4AF37] pb-4 flex items-center gap-3">
          <FaBoxOpen /> Gestión de Pedidos
        </h1>

        {/* 🔹 PESTAÑAS DE FILTRO */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('paid')}
            className={`px-6 py-2 rounded-full font-bold transition flex items-center gap-2 ${
              activeTab === 'paid' 
              ? 'bg-[#D4AF37] text-black shadow-[0_0_10px_#D4AF37]' 
              : 'bg-[#111] text-gray-500 border border-gray-800 hover:border-gray-500'
            }`}
          >
            <FaCheckCircle /> Ventas Confirmadas
          </button>

          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-full font-bold transition flex items-center gap-2 ${
              activeTab === 'pending' 
              ? 'bg-yellow-600 text-black' 
              : 'bg-[#111] text-gray-500 border border-gray-800 hover:border-gray-500'
            }`}
          >
            <FaClock /> Carritos Abandonados
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 animate-pulse">Cargando datos...</p>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-[#111] rounded-lg border border-gray-800">
            <p className="text-xl text-gray-400">
              {activeTab === 'paid' 
                ? "Aún no hay ventas completadas hoy. ¡Ánimo! 🚀" 
                : "No hay carritos abandonados recientes. 🧹"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map((order) => (
              <div key={order._id} className={`bg-[#111] border rounded-lg p-6 transition-all ${activeTab === 'paid' ? 'border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-gray-800 opacity-75'}`}>
                
                {/* Cabecera */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b border-gray-800 pb-4">
                  <div>
                    <span className="text-gray-500 text-xs uppercase tracking-widest">Referencia</span>
                    <p className="font-mono text-[#D4AF37] font-bold text-lg">{order.orderId}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="mt-2 md:mt-0 text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                      {order.status === 'paid' ? '✅ PAGADO' : '⏳ PENDIENTE / ABANDONADO'}
                    </span>
                    <p className="text-2xl font-bold mt-2">₡ {order.total?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Cliente */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Cliente</p>
                    <p className="font-semibold text-lg">{order.customer?.name}</p>
                    <p className="text-sm text-gray-400">{order.customer?.email}</p>
                  </div>
                  {/* Aquí podrías poner dirección si la tuvieras */}
                </div>

                {/* Productos a Alistar */}
                <div className="bg-black/80 rounded border border-gray-800 p-4">
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <FaBoxOpen /> Artículos a preparar:
                  </p>
                  <ul className="space-y-4">
                    {order.items?.map((item, index) => (
                      <li key={index} className="flex items-center gap-4 border-b border-gray-900 pb-2 last:border-0 last:pb-0">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded border border-gray-700" />
                        )}
                        <div className="flex-1">
                          <p className="text-base font-bold text-white">{item.name}</p>
                          <p className="text-sm text-[#D4AF37]">Talla: {item.size} <span className="text-gray-500">|</span> Color: {item.color || "N/A"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Cant.</p>
                          <p className="text-xl font-bold text-white">x{item.quantity}</p>
                        </div>
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