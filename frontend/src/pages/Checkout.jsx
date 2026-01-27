import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLock, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function Checkout() {
  const { cart, cartTotal } = useCart();
  const navigate = useNavigate();
  
  // Estados para Ubicación CR
  const [provincias, setProvincias] = useState({});
  const [cantones, setCantones] = useState({});
  const [distritos, setDistritos] = useState({});
  
  const [selectedProvincia, setSelectedProvincia] = useState("");
  const [selectedCanton, setSelectedCanton] = useState("");
  const [selectedDistrito, setSelectedDistrito] = useState("");

  const [loadingLocation, setLoadingLocation] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccionExacta: '', // Ahora solo la seña exacta
    correo: ''
  });

  // --- CARGAR PROVINCIAS AL INICIO ---
  useEffect(() => {
    fetch('https://ubicaciones.paginasweb.cr/provincias.json')
      .then(res => res.json())
      .then(data => setProvincias(data))
      .catch(err => console.error(err));
  }, []);

  // --- CARGAR CANTONES CUANDO CAMBIA PROVINCIA ---
  const handleProvinciaChange = (e) => {
    const idProvincia = e.target.value;
    setSelectedProvincia(idProvincia);
    setSelectedCanton(""); // Resetear siguientes
    setSelectedDistrito("");
    setCantones({});
    setDistritos({});

    if (idProvincia) {
      setLoadingLocation(true);
      fetch(`https://ubicaciones.paginasweb.cr/provincia/${idProvincia}/cantones.json`)
        .then(res => res.json())
        .then(data => { setCantones(data); setLoadingLocation(false); })
        .catch(err => console.error(err));
    }
  };

  // --- CARGAR DISTRITOS CUANDO CAMBIA CANTON ---
  const handleCantonChange = (e) => {
    const idCanton = e.target.value;
    setSelectedCanton(idCanton);
    setSelectedDistrito("");
    setDistritos({});

    if (idCanton && selectedProvincia) {
      setLoadingLocation(true);
      fetch(`https://ubicaciones.paginasweb.cr/provincia/${selectedProvincia}/canton/${idCanton}/distritos.json`)
        .then(res => res.json())
        .then(data => { setDistritos(data); setLoadingLocation(false); })
        .catch(err => console.error(err));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePayment = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre || !formData.telefono || !formData.direccionExacta) {
      return toast.warning("Por favor llena todos los datos.");
    }
    if (!selectedProvincia || !selectedCanton || !selectedDistrito) {
      return toast.warning("Selecciona Provincia, Cantón y Distrito.");
    }

    // Obtener nombres reales de los IDs seleccionados
    const nombreProvincia = provincias[selectedProvincia];
    const nombreCanton = cantones[selectedCanton];
    const nombreDistrito = distritos[selectedDistrito];

    // Construir dirección completa
    const direccionCompleta = `${nombreProvincia}, ${nombreCanton}, ${nombreDistrito}. ${formData.direccionExacta}`;

    let mensaje = `🆕 *NUEVO PEDIDO WEB*\n`;
    mensaje += `👤 Cliente: ${formData.nombre}\n`;
    mensaje += `📞 Tel: ${formData.telefono}\n`;
    mensaje += `📍 Ubicación: ${nombreProvincia}, ${nombreCanton}, ${nombreDistrito}\n`;
    mensaje += `🏠 Señas: ${formData.direccionExacta}\n\n`;
    mensaje += `*PEDIDO:*\n`;
    
    cart.forEach(item => {
      mensaje += `▪️ ${item.quantity}x ${item.name} (${item.selectedSize})\n`;
    });
    
    mensaje += `\n💰 *TOTAL A PAGAR: ₡${cartTotal.toLocaleString()}*`;
    
    window.open(`https://wa.me/50672327096?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 px-4">
        <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío 🛒</h2>
        <button onClick={() => navigate('/')} className="bg-black text-white px-6 py-2 rounded-lg font-bold">Volver al catálogo</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* IZQUIERDA: FORMULARIO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-black font-medium">
            <FaArrowLeft /> Volver
          </button>
          
          <h2 className="text-2xl font-black italic uppercase mb-6">Datos de Envío</h2>
          
          <form onSubmit={handlePayment} className="space-y-4">
            {/* Datos Personales */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
              <input type="text" name="nombre" onChange={handleChange} className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 ring-black outline-none transition" placeholder="Ej: Juan Pérez" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                  <input type="tel" name="telefono" onChange={handleChange} className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 ring-black outline-none transition" placeholder="Ej: 8888-8888" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo (Opcional)</label>
                  <input type="email" name="correo" onChange={handleChange} className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 ring-black outline-none transition" placeholder="juan@gmail.com" />
                </div>
            </div>

            {/* SELECCIÓN DE UBICACIÓN CR */}
            <div className="pt-4 border-t mt-4">
              <p className="font-bold text-sm mb-3 flex items-center gap-2"><FaMapMarkerAlt/> Ubicación</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {/* Provincia */}
                <div>
                   <label className="text-[10px] font-bold text-gray-400">PROVINCIA</label>
                   <select className="w-full border p-2 rounded bg-white" value={selectedProvincia} onChange={handleProvinciaChange} required>
                     <option value="">Seleccionar...</option>
                     {Object.entries(provincias).map(([id, nombre]) => (
                       <option key={id} value={id}>{nombre}</option>
                     ))}
                   </select>
                </div>

                {/* Cantón */}
                <div>
                   <label className="text-[10px] font-bold text-gray-400">CANTÓN</label>
                   <select className="w-full border p-2 rounded bg-white" value={selectedCanton} onChange={handleCantonChange} disabled={!selectedProvincia} required>
                     <option value="">Seleccionar...</option>
                     {Object.entries(cantones).map(([id, nombre]) => (
                       <option key={id} value={id}>{nombre}</option>
                     ))}
                   </select>
                </div>

                {/* Distrito */}
                <div>
                   <label className="text-[10px] font-bold text-gray-400">DISTRITO</label>
                   <select className="w-full border p-2 rounded bg-white" value={selectedDistrito} onChange={(e) => setSelectedDistrito(e.target.value)} disabled={!selectedCanton} required>
                     <option value="">Seleccionar...</option>
                     {Object.entries(distritos).map(([id, nombre]) => (
                       <option key={id} value={id}>{nombre}</option>
                     ))}
                   </select>
                </div>
              </div>
            </div>

            {/* Dirección Exacta */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Exacta / Señas</label>
              <textarea name="direccionExacta" onChange={handleChange} rows="2" className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 ring-black outline-none transition" placeholder="Frente a la plaza de fútbol, casa color blanca..." required></textarea>
            </div>
            
            <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition shadow-lg mt-6 flex justify-center items-center gap-2 active:scale-[0.98]">
               <FaLock size={16} /> PAGAR ₡{cartTotal.toLocaleString()}
            </button>
            <p className="text-[10px] text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
              <FaLock size={10} /> Pagos procesados de forma segura
            </p>
          </form>
        </div>

        {/* DERECHA: RESUMEN DE ORDEN (Igual que antes) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-28">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Resumen del Pedido</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.map((item, index) => (
              <div key={`${item._id}-${index}`} className="flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-md border overflow-hidden flex-shrink-0">
                    <img src={item.imageSrc || 'https://via.placeholder.com/80'} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm uppercase line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500">Talla: {item.selectedSize} | Cant: {item.quantity}</p>
                  <p className="font-bold text-sm mt-1">₡{((item.discountPrice || item.price) * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t mt-6 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₡{cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Envío</span>
              <span>Por calcular</span>
            </div>
            <div className="flex justify-between text-xl font-black mt-4 pt-4 border-t border-dashed">
              <span>TOTAL</span>
              <span>₡{cartTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}