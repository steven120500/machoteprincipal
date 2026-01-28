import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLock, FaMapMarkerAlt, FaTruck, FaTrash, FaWhatsapp, FaCreditCard } from 'react-icons/fa';
import { toast } from 'react-toastify';

// 🧠 CEREBRO DEL GAM
const GAM_CANTONES = {
  "1": ["1", "2", "3", "6", "8", "9", "10", "13", "14", "15", "18"], 
  "2": ["1", "2", "5", "8"], 
  "3": ["1", "2", "3", "4", "6", "8"], 
  "4": ["1", "2", "3", "4", "5", "6", "7", "8", "9"] 
};

// ⚠️ AJUSTA ESTO SI TU BACKEND TIENE OTRA RUTA
const API_BASE = "https://machoteprincipal.onrender.com"; 

export default function Checkout() {
  const { cart, cartTotal, removeFromCart } = useCart();
  const navigate = useNavigate();
  
  // Estados de Ubicación
  const [provincias, setProvincias] = useState({});
  const [cantones, setCantones] = useState({});
  const [distritos, setDistritos] = useState({});
  
  const [selectedProvincia, setSelectedProvincia] = useState("");
  const [selectedCanton, setSelectedCanton] = useState("");
  const [selectedDistrito, setSelectedDistrito] = useState("");

  // Estados de Envío y Pago
  const [opcionesEnvio, setOpcionesEnvio] = useState([]); 
  const [envioSeleccionado, setEnvioSeleccionado] = useState(null);
  const [metodoPago, setMetodoPago] = useState("tarjeta");
  
  const [loadingPay, setLoadingPay] = useState(false);

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

  // 3. Al cambiar Cantón
  const handleCantonChange = (e) => {
    const idCanton = e.target.value;
    setSelectedCanton(idCanton);
    setSelectedDistrito("");
    setDistritos({});

    if (idCanton && selectedProvincia) {
      fetch(`https://ubicaciones.paginasweb.cr/provincia/${selectedProvincia}/canton/${idCanton}/distritos.json`)
        .then(res => res.json())
        .then(data => setDistritos(data));

      const esZonaGam = GAM_CANTONES[selectedProvincia]?.includes(idCanton);
      const nuevasOpciones = [];

      // OPCIÓN A: Correos
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
      setEnvioSeleccionado(nuevasOpciones[0]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 👇 FUNCIÓN MAESTRA QUE DECIDE QUÉ HACER 👇
  const handleProcessOrder = async (e) => {
    e.preventDefault();
    
    // 1. Validaciones
    if (!formData.nombre || !formData.telefono || !formData.direccionExacta || !selectedDistrito) {
      return toast.warning("Por favor llena todos los datos.");
    }
    if (!envioSeleccionado) return toast.warning("Selecciona un método de envío.");

    const totalFinal = cartTotal + envioSeleccionado.precio;
    const nombreProvincia = provincias[selectedProvincia];
    const nombreCanton = cantones[selectedCanton];
    const nombreDistrito = distritos[selectedDistrito];

    // --- OPCIÓN A: PAGO POR SINPE (WHATSAPP MEJORADO) ---
    if (metodoPago === 'sinpe') {
        // Construimos el mensaje línea por línea para asegurar formato
        let mensaje = `*NUEVO PEDIDO - FUTSTORE*\n`;
        mensaje += `────────────────\n`;
        mensaje += `Cliente: ${formData.nombre}\n`;
        mensaje += `Tel: ${formData.telefono}\n`;
        mensaje += `Ubicación: ${nombreProvincia}, ${nombreCanton}, ${nombreDistrito}\n`;
        mensaje += `Detalle: ${formData.direccionExacta}\n`;
        mensaje += `────────────────\n`;
        
        mensaje += `*MÉTODO DE ENVÍO:*\n`;
        mensaje += `➡ ${envioSeleccionado.nombre}\n`;
        mensaje += `Costo envío: ₡${envioSeleccionado.precio.toLocaleString()}\n`;
        mensaje += `────────────────\n`;

        mensaje += `*DETALLE DE PRODUCTOS:*\n`;
        cart.forEach(item => {
          // Intentamos obtener la versión (type), si no existe, no ponemos nada
          const version = item.type ? `[${item.type}]` : '';
          const precioItem = (item.discountPrice || item.price).toLocaleString();
          
          mensaje += `*${item.quantity}x ${item.name}* ${version}\n`;
          mensaje += `   └ Talla: ${item.selectedSize}\n`;
          mensaje += `   └ Precio c/u: ₡${precioItem}\n`;
        });
        
        mensaje += `────────────────\n`;
        mensaje += `*TOTAL A PAGAR: ₡${totalFinal.toLocaleString()}*\n`;
        mensaje += `*Método de Pago:* SINPE MÓVIL\n\n`;
        mensaje += `Quedo atento a la cuenta SINPE para enviar el comprobante. ✅`;

        // Abrir WhatsApp con codificación segura
        window.open(`https://wa.me/50672327096?text=${encodeURIComponent(mensaje)}`, '_blank');
        return;
    }

    // --- OPCIÓN B: PAGO CON TARJETA (TILOPAY) ---
    if (metodoPago === 'tarjeta') {
        const orderData = {
          cliente: {
            nombre: formData.nombre,
            telefono: formData.telefono,
            correo: formData.correo || "cliente@futstore.cr",
            direccion: `${nombreProvincia}, ${nombreCanton}, ${nombreDistrito}. ${formData.direccionExacta}`
          },
          productos: cart.map(item => ({
            nombre: item.name,
            precio: item.discountPrice || item.price,
            cantidad: item.quantity,
            talla: item.selectedSize,
            version: item.type // Enviamos la versión al backend también
          })),
          envio: {
            metodo: envioSeleccionado.nombre,
            precio: envioSeleccionado.precio
          },
          total: totalFinal
        };

        setLoadingPay(true);
        
        try {
          const res = await fetch(`${API_BASE}/api/tilopay/create-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
          });

          const data = await res.json();

          if (!res.ok) throw new Error(data.message || "Error al crear pago");

          if (data.url) {
            window.location.href = data.url; 
          } else {
            toast.error("No se recibió el link de pago.");
          }

        } catch (error) {
          console.error(error);
          toast.error("Error conectando con el banco. Intenta de nuevo.");
        } finally {
          setLoadingPay(false);
        }
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pt-20 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Tu carrito está vacío 🛒</h2>
        <button onClick={() => navigate('/')} className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg">
          Volver al Catálogo
        </button>
      </div>
    );
  }

  const precioEnvio = envioSeleccionado ? envioSeleccionado.precio : 0;
  const granTotal = cartTotal + precioEnvio;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- IZQUIERDA --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-black font-medium">
            <FaArrowLeft /> Volver
          </button>
          
          <h2 className="text-2xl font-black italic uppercase mb-6">Finalizar Compra</h2>
          
          <form onSubmit={handleProcessOrder} className="space-y-5">
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
                    <input type="email" name="correo" onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 ring-black outline-none" placeholder="juan@email.com" required={metodoPago === 'tarjeta'} />
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

            {/* 3. Selección de Envío */}
            {opcionesEnvio.length > 0 && (
              <div className="border-t pt-4 animate-fade-in">
                <p className="font-bold text-sm mb-3 flex items-center gap-2"><FaTruck/> Método de Envío</p>
                <div className="space-y-3">
                  {opcionesEnvio.map((opcion) => (
                    <label key={opcion.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${envioSeleccionado?.id === opcion.id ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-400'}`}>
                      <input type="radio" name="envio" className="accent-black w-5 h-5 mr-3" checked={envioSeleccionado?.id === opcion.id} onChange={() => setEnvioSeleccionado(opcion)} />
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

            {/* 4. SELECCIÓN DE MÉTODO DE PAGO */}
            <div className="border-t pt-4">
                <p className="font-bold text-sm mb-3 flex items-center gap-2">💳 Método de Pago</p>
                <div className="grid grid-cols-2 gap-4">
                    {/* Opción Tarjeta */}
                    <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${metodoPago === 'tarjeta' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-400'}`}>
                        <input type="radio" name="pago" value="tarjeta" className="hidden" checked={metodoPago === 'tarjeta'} onChange={() => setMetodoPago('tarjeta')} />
                        <FaCreditCard size={24} className="text-black"/>
                        <span className="font-bold text-xs">Tarjeta</span>
                    </label>

                    {/* Opción SINPE */}
                    <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${metodoPago === 'sinpe' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-400'}`}>
                        <input type="radio" name="pago" value="sinpe" className="hidden" checked={metodoPago === 'sinpe'} onChange={() => setMetodoPago('sinpe')} />
                        <FaWhatsapp size={24} className="text-black"/>
                        <span className="font-bold text-xs">SINPE-Movil</span>
                    </label>
                </div>
            </div>
            
            {/* BOTÓN DINÁMICO */}
            <button 
              type="submit" 
              disabled={loadingPay}
              className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-lg mt-6 flex justify-center items-center gap-2 active:scale-[0.98] 
                ${loadingPay ? 'bg-gray-400 cursor-not-allowed text-white' : 
                  metodoPago === 'sinpe' ? 'bg-black hover:bg-gray-800 text-white' : 'bg-black hover:bg-gray-800 text-white'
                }`}
            >
               {loadingPay ? (
                 <>Procesando...</>
               ) : (
                 metodoPago === 'sinpe' ? (
                    <> <FaWhatsapp size={20} /> ENVIAR PEDIDO POR WHATSAPP</>
                 ) : (
                    <> <FaLock size={16} /> PAGAR CON TARJETA </>
                 )
               )}
            </button>
            
            {metodoPago === 'tarjeta' && (
                <div className="flex justify-center gap-2 mt-4 grayscale opacity-60">
                   <span className="text-[10px] text-gray-400">Pagos seguros procesados por TiloPay</span>
                </div>
            )}
          </form>
        </div>

        {/* --- DERECHA: RESUMEN (Ahora muestra Versión) --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit lg:sticky lg:top-28">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Resumen del Pedido</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.map((item, index) => (
              <div key={`${item._id}-${index}`} className="flex gap-4 items-start border-b border-gray-50 pb-4 last:border-0">
                <div className="w-16 h-16 bg-gray-100 rounded-md border overflow-hidden flex-shrink-0 relative">
                    <img src={item.imageSrc || 'https://via.placeholder.com/80'} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 flex justify-between">
                  <div className="pr-2">
                    <p className="font-bold text-xs uppercase line-clamp-2 leading-tight mb-1">{item.name}</p>
                    {/* 👇 AQUÍ MOSTRAMOS LA VERSIÓN SI EXISTE */}
                    {item.type && <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold">{item.type}</span>}
                    
                    <p className="text-[10px] text-gray-500 mt-1">Talla: <span className="font-bold text-black">{item.selectedSize}</span> | Cant: {item.quantity}</p>
                    <p className="font-bold text-sm mt-1">₡{((item.discountPrice || item.price) * item.quantity).toLocaleString()}</p>
                  </div>
                  <button onClick={() => removeFromCart(item._id || item.id, item.selectedSize)} className="text-gray-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-full" title="Eliminar producto" type="button">
                    <FaTrash size={14} />
                  </button>
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
              <span>{envioSeleccionado ? `₡${envioSeleccionado.precio.toLocaleString()}` : "Por calcular..."}</span>
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