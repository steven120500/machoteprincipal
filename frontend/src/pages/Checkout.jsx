import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLock, FaMapMarkerAlt, FaTruck } from 'react-icons/fa';
import { toast } from 'react-toastify';

// 🧠 CEREBRO DEL GAM
// 1=SJ, 2=Alajuela, 3=Cartago, 4=Heredia
const GAM_CANTONES = {
  "1": ["1", "2", "3", "6", "8", "9", "10", "13", "14", "15", "18"], 
  "2": ["1", "2", "5", "8"], 
  "3": ["1", "2", "3", "4", "6", "8"], 
  "4": ["1", "2", "3", "4", "5", "6", "7", "8", "9"] 
};

export default function Checkout() {
  const { cart, cartTotal } = useCart();
  const navigate = useNavigate();
  
  // Estados de Ubicación
  const [provincias, setProvincias] = useState({});
  const [cantones, setCantones] = useState({});
  const [distritos, setDistritos] = useState({});
  
  const [selectedProvincia, setSelectedProvincia] = useState("");
  const [selectedCanton, setSelectedCanton] = useState("");
  const [selectedDistrito, setSelectedDistrito] = useState("");

  // Estados de Envío
  const [opcionesEnvio, setOpcionesEnvio] = useState([]); // Lista de opciones disponibles
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null); // La opción elegida

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccionExacta: '',
    correo: ''
  });

  // 1. Cargar Provincias
  useEffect(() => {
    fetch('https://ubicaciones.paginasweb.cr/provincias.json')
      .then(res => res.json())
      .then(data => setProvincias(data))
      .catch(err => console.error(err));
  }, []);

  // 2. Al cambiar Provincia
  const handleProvinciaChange = (e) => {
    const id = e.target.value;
    setSelectedProvincia(id);
    setSelectedCanton("");
    setSelectedDistrito("");
    setCantones({});
    setDistritos({});
    setOpcionesEnvio([]);
    setEnvioSeleccionado(null);
    
    if (id) {
      fetch(`https://ubicaciones.paginasweb.cr/provincia/${id}/cantones.json`)
        .then(res => res.json())
        .then(data => setCantones(data));
    }
  };

  // 3. Al cambiar Cantón (Calculamos las opciones)
  const handleCantonChange = (e) => {
    const idCanton = e.target.value;
    setSelectedCanton(idCanton);
    setSelectedDistrito("");
    setDistritos({});

    if (idCanton && selectedProvincia) {
      // Cargar Distritos
      fetch(`https://ubicaciones.paginasweb.cr/provincia/${selectedProvincia}/canton/${idCanton}/distritos.json`)
        .then(res => res.json())
        .then(data => setDistritos(data));

      // --- CÁLCULO DE OPCIONES ---
      const esZonaGam = GAM_CANTONES[selectedProvincia]?.includes(idCanton);
      const nuevasOpciones = [];

      // OPCIÓN A: Correos (Siempre)
      nuevasOpciones.push({
        id: 'correos',
        nombre: 'Correos de Costa Rica',
        precio: 3500,
        detalle: esZonaGam ? 'Entrega día siguiente (GAM)' : 'Entrega 1-2 días hábiles'
      });

      // OPCIÓN B: Mensajero (Solo GAM)
      if (esZonaGam) {
        const esCartago = selectedProvincia === "3";
        const precioMensajero = esCartago ? 5000 : 4000;
        
        nuevasOpciones.push({
          id: 'mensajero',
          nombre: 'Mensajero Privado',
          precio: precioMensajero,
          detalle: 'Entrega día siguiente (Servicio Express)'
        });
      }

      setOpcionesEnvio(nuevasOpciones);
      setEnvioSeleccionado(nuevasOpciones[0]); // Seleccionar la primera por defecto
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePayment = (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.telefono || !formData.direccionExacta || !selectedDistrito) {
      return toast.warning("Por favor llena todos los datos.");
    }
    if (!envioSeleccionado) {
      return toast.warning("Selecciona un método de envío.");
    }

    const nombreProvincia = provincias[selectedProvincia];
    const nombreCanton = cantones[selectedCanton];
    const nombreDistrito = distritos[selectedDistrito];
    const totalFinal = cartTotal + envioSeleccionado.precio;

    let mensaje = `🆕 *NUEVO PEDIDO WEB*\n`;
    mensaje += `👤 Cliente: ${formData.nombre}\n`;
    mensaje += `📞 Tel: ${formData.telefono}\n`;
    mensaje += `📍 Ubicación: ${nombreProvincia}, ${nombreCanton}, ${nombreDistrito}\n`;
    mensaje += `🏠 Señas: ${formData.direccionExacta}\n\n`;
    
    mensaje += `📦 *ENVÍO:* ${envioSeleccionado.nombre} (₡${envioSeleccionado.precio.toLocaleString()})\n`;
    
    mensaje += `\n🛒 *PRODUCTOS:*\n`;
    cart.forEach(item => {
      mensaje += `▪️ ${item.quantity}x ${item.name} (${item.selectedSize})\n`;
    });
    
    mensaje += `\n💰 *TOTAL A PAGAR: ₡${totalFinal.toLocaleString()}*`;
    
    window.open(`https://wa.me/50672327096?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  if (cart.length === 0) return null; 

  const precioEnvio = envioSeleccionado ? envioSeleccionado.precio : 0;
  const granTotal = cartTotal + precioEnvio;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- IZQUIERDA: DATOS --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-black font-medium">
            <FaArrowLeft /> Volver
          </button>
          
          <h2 className="text-2xl font-black italic uppercase mb-6">Información de Envío</h2>
          
          <form onSubmit={handlePayment} className="space-y-5">
            {/* 1. Datos Personales */}
            <div className="grid grid-cols-1 gap-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                  <input type="text" name="nombre" onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 ring-black outline-none" placeholder="Tu nombre" required />
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                    <input type="tel" name="telefono" onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 ring-black outline-none" placeholder="8888-8888" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Correo</label>
                    <input type="email" name="correo" onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 ring-black outline-none" placeholder="Opcional" />
                  </div>
               </div>
            </div>

            {/* 2. Dirección */}
            <div className="border-t pt-4">
              <p className="font-bold text-sm mb-3 flex items-center gap-2"><FaMapMarkerAlt/> ¿Dónde entregamos?</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                 <select className="border p-2 rounded bg-gray-50 text-sm" value={selectedProvincia} onChange={handleProvinciaChange} required>
                   <option value="">Provincia</option>
                   {Object.entries(provincias).map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
                 </select>
                 <select className="border p-2 rounded bg-gray-50 text-sm" value={selectedCanton} onChange={handleCantonChange} disabled={!selectedProvincia} required>
                   <option value="">Cantón</option>
                   {Object.entries(cantones).map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
                 </select>
                 <select className="border p-2 rounded bg-gray-50 text-sm" value={selectedDistrito} onChange={(e) => setSelectedDistrito(e.target.value)} disabled={!selectedCanton} required>
                   <option value="">Distrito</option>
                   {Object.entries(distritos).map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
                 </select>
              </div>
              <textarea name="direccionExacta" onChange={handleChange} rows="2" className="w-full border p-2 rounded text-sm focus:ring-2 ring-black outline-none" placeholder="Señas exactas (color de casa, frente a...)" required></textarea>
            </div>

            {/* 3. SELECCIÓN DE ENVÍO (Radio Buttons) */}
            {opcionesEnvio.length > 0 && (
              <div className="border-t pt-4 animate-fade-in">
                <p className="font-bold text-sm mb-3 flex items-center gap-2"><FaTruck/> Método de Envío</p>
                <div className="space-y-3">
                  {opcionesEnvio.map((opcion) => (
                    <label 
                      key={opcion.id} 
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${envioSeleccionado?.id === opcion.id ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-400'}`}
                    >
                      <input 
                        type="radio" 
                        name="envio" 
                        className="accent-black w-5 h-5 mr-3"
                        checked={envioSeleccionado?.id === opcion.id}
                        onChange={() => setEnvioSeleccionado(opcion)}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between font-bold text-sm">
                          <span>{opcion.nombre}</span>
                          <span>₡{opcion.precio.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{opcion.detalle}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition shadow-lg mt-6 flex justify-center items-center gap-2 active:scale-[0.98]">
               <FaLock size={16} /> PAGAR ₡{granTotal.toLocaleString()}
            </button>
            <p className="text-[10px] text-center text-gray-400 mt-2">Pagos procesados de forma segura</p>
          </form>
        </div>

        {/* --- DERECHA: RESUMEN --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit lg:sticky lg:top-28">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Resumen del Pedido</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.map((item, index) => (
              <div key={`${item._id}-${index}`} className="flex gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-md border overflow-hidden flex-shrink-0">
                    <img src={item.imageSrc || 'https://via.placeholder.com/80'} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-xs uppercase line-clamp-1">{item.name}</p>
                  <p className="text-[10px] text-gray-500">Talla: {item.selectedSize} | x{item.quantity}</p>
                  <p className="font-bold text-xs mt-1">₡{((item.discountPrice || item.price) * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t mt-6 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₡{cartTotal.toLocaleString()}</span>
            </div>
            
            <div className={`flex justify-between ${envioSeleccionado ? 'text-black font-bold' : 'text-gray-400 italic'}`}>
              <span>Envío</span>
              <span>
                {envioSeleccionado 
                  ? `₡${envioSeleccionado.precio.toLocaleString()}` 
                  : "Por calcular..."}
              </span>
            </div>

            <div className="flex justify-between text-xl font-black mt-4 pt-4 border-t border-dashed">
              <span>TOTAL</span>
              <span>₡{granTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}