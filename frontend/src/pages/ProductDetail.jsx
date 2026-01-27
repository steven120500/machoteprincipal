import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaWhatsapp, FaTimes, FaChevronLeft, FaChevronRight, FaEdit, FaTrash, FaSave, FaArrowLeft } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "https://machoteprincipal.onrender.com";

// --- Constantes y Helpers (Igual que en el Modal) ---
const TALLAS_ADULTO = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const TALLAS_NINO   = ['16', '18', '20', '22', '24', '26', '28'];
const TALLAS_BALON  = ['3', '4', '5'];
const ACCEPTED_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/heic'];

function transformCloudinary(url, maxW = 800) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('res.cloudinary.com')) return url;
    const parts = u.pathname.split('/upload/');
    if (parts.length < 2) return url;
    return `${parts[0]}/upload/f_auto,q_auto:eco,c_limit,w_${maxW},dpr_auto/${parts[1]}`;
  } catch { return url; }
}

export default function ProductDetail({ user, onUpdate }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estado Principal
  const [product, setProduct] = useState(null);
  const [loadingFetch, setLoadingFetch] = useState(true);
  
  // Estados de Interacción Cliente
  const [selectedSize, setSelectedSize] = useState("");
  const [idx, setIdx] = useState(0); // Índice del carrusel

  // Estados de Admin (Edición)
  const [isEditing, setIsEditing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Formulario de Edición
  const [editedName, setEditedName] = useState('');
  const [editedPrice, setEditedPrice] = useState(0);
  const [editedDiscountPrice, setEditedDiscountPrice] = useState('');
  const [editedType, setEditedType] = useState('Player');
  const [editedStock, setEditedStock] = useState({});
  const [editedIsNew, setEditedIsNew] = useState(false);
  const [localImages, setLocalImages] = useState([]);

  // Permisos
  const isSuperUser = user?.isSuperUser || user?.roles?.includes("edit");
  const canDelete = user?.isSuperUser || user?.roles?.includes("delete");

  // 1. CARGAR PRODUCTO AL ENTRAR A LA PÁGINA
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) throw new Error("Producto no encontrado");
        const data = await res.json();
        setProduct(data);
        
        // Inicializar formulario de edición
        syncEditState(data);
      } catch (err) {
        toast.error("No se pudo cargar el producto");
        navigate('/');
      } finally {
        setLoadingFetch(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const syncEditState = (data) => {
    setEditedName(data.name || '');
    setEditedPrice(data.price ?? 0);
    setEditedDiscountPrice(data.discountPrice ?? '');
    setEditedType(data.type || 'Player');
    setEditedStock({ ...(data.stock || {}) });
    setEditedIsNew(Boolean(data.isNew));
    
    // Preparar imágenes
    const imgs = data.images?.length 
      ? data.images 
      : [data.imageSrc, data.imageSrc2].filter(Boolean);
      
    setLocalImages(imgs.map(img => ({ 
      src: typeof img === 'string' ? img : img.url, 
      isNew: false 
    })));
  };

  // --- LÓGICA DE EDICIÓN Y GUARDADO (Porteada del Modal) ---
  const handleSave = async () => {
    if (loadingAction) return;
    setLoadingAction(true);
    try {
      const displayName = user?.username || 'Admin';
      
      const cleanStock = (obj) => Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, Math.max(0, parseInt(v, 10) || 0)])
      );

      const payload = {
        name: editedName.trim(),
        price: parseInt(editedPrice, 10) || 0,
        discountPrice: editedDiscountPrice ? parseInt(editedDiscountPrice, 10) : null,
        type: editedType,
        stock: cleanStock(editedStock),
        images: localImages.map(i => i.src), // Envía base64 o URLs
        isNew: editedIsNew,
      };

      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user': displayName },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al actualizar");

      const updated = await res.json();
      setProduct(updated);
      setIsEditing(false);
      if (onUpdate) onUpdate(updated); // Actualiza la lista en App.jsx
      toast.success("Producto actualizado");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // --- LÓGICA DE ELIMINAR (Porteada del Modal) ---
  const executeDelete = async () => {
    if (loadingAction) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user': user?.username || 'Admin' },
      });

      if (!res.ok) throw new Error("Error al eliminar");

      toast.success("Producto eliminado");
      if (onUpdate) onUpdate(null, id); // Avisa a App.jsx para borrarlo de la lista
      navigate('/', { replace: true }); // Vuelve al home
    } catch (err) {
      toast.error(err.message);
      setShowConfirmDelete(false);
    } finally {
      setLoadingAction(false);
    }
  };

  // --- MANEJO DE IMÁGENES (Subida Local) ---
  const handleImageChange = (e, index) => {
    const file = e.target.files?.[0];
    if (!file || !ACCEPTED_TYPES.includes(file.type)) return toast.error("Formato inválido");
    
    const reader = new FileReader();
    reader.onload = () => {
      setLocalImages(prev => {
        const copy = [...prev];
        if (index >= copy.length) copy.push({ src: reader.result, isNew: true });
        else copy[index] = { src: reader.result, isNew: true };
        return copy;
      });
      setIdx(index); // Mueve el carrusel a la nueva foto
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (index) => {
    setLocalImages(prev => prev.filter((_, i) => i !== index));
    setIdx(0);
  };

  // --- LÓGICA DE COMPRA (WhatsApp) ---
  const handleBuy = () => {
    if (!selectedSize) return toast.warning("Por favor, selecciona una talla.");
    
    const mensaje = `👋 ¡Hola! Me interesa comprar:
    
👕 *${product.name}*
📏 Talla: *${selectedSize}*
💰 Precio: ₡${product.discountPrice || product.price}
    
🔗 ${window.location.href}`;

    window.open(`https://wa.me/50672327096?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  // --- RENDERIZADO ---
  if (loadingFetch) return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  if (!product) return null;

  const currentSrc = localImages[idx]?.src || '';
  const displayUrl = currentSrc ? transformCloudinary(currentSrc, 800) : '';
  
  // Determinar tallas a mostrar
  const currentType = isEditing ? editedType : product.type;
  const tallasVisibles = currentType === 'Balón' ? TALLAS_BALON : (currentType === 'Niño' ? TALLAS_NINO : TALLAS_ADULTO);

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Botón Volver */}
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black transition font-medium"
      >
        <FaArrowLeft /> Volver al catálogo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* === COLUMNA IZQUIERDA: GALERÍA === */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {displayUrl ? (
                <motion.img
                  key={displayUrl}
                  src={displayUrl}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <span className="text-gray-300">Sin imagen</span>
              )}
            </AnimatePresence>

            {/* Flechas Carrusel (Solo si no editamos y hay varias fotos) */}
            {!isEditing && localImages.length > 1 && (
              <>
                <button onClick={() => setIdx((i) => (i - 1 + localImages.length) % localImages.length)} className="absolute left-4 bg-white/80 p-3 rounded-full shadow hover:bg-white transition">
                  <FaChevronLeft />
                </button>
                <button onClick={() => setIdx((i) => (i + 1) % localImages.length)} className="absolute right-4 bg-white/80 p-3 rounded-full shadow hover:bg-white transition">
                  <FaChevronRight />
                </button>
              </>
            )}
          </div>

          {/* Tiras de Miniaturas / Edición de Fotos */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {localImages.map((img, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img 
                  src={transformCloudinary(img.src, 150)} 
                  onClick={() => setIdx(i)}
                  className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 transition ${idx === i ? 'border-black' : 'border-transparent'}`}
                />
                {isEditing && (
                  <button 
                    onClick={() => handleImageRemove(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs shadow-sm"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}
            
            {/* Botón añadir foto (Solo Editando) */}
            {isEditing && localImages.length < 5 && (
              <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-black text-gray-400 hover:text-black transition">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, localImages.length)} />
                <span className="text-xs font-bold">+ FOTO</span>
              </label>
            )}
          </div>
        </div>

        {/* === COLUMNA DERECHA: INFO Y COMPRA === */}
        <div className="flex flex-col">
          
          {/* MODO EDICIÓN */}
          {isEditing ? (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FaEdit/> Editando Producto</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                  <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
                  <select value={editedType} onChange={e => setEditedType(e.target.value)} className="w-full border p-2 rounded">
                    {['Player','Fan','Mujer','Nacional','Abrigos','Retro','Niño','Balón'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Precio</label>
                  <input type="number" value={editedPrice} onChange={e => setEditedPrice(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Descuento (Opcional)</label>
                  <input type="number" value={editedDiscountPrice} onChange={e => setEditedDiscountPrice(e.target.value)} className="w-full border p-2 rounded" placeholder="0" />
                </div>
              </div>

              <div className="bg-white p-4 rounded border">
                <p className="text-xs font-bold mb-2 uppercase">Stock por Talla</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {tallasVisibles.map(t => (
                    <div key={t} className="flex flex-col items-center">
                      <span className="text-xs text-gray-500 mb-1">{t}</span>
                      <input 
                        type="number" 
                        className="w-full border text-center p-1 rounded text-sm" 
                        value={editedStock[t] ?? 0}
                        onChange={(e) => setEditedStock(prev => ({ ...prev, [t]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editedIsNew} onChange={e => setEditedIsNew(e.target.checked)} />
                <span className="text-sm">Marcar como <strong>NUEVO</strong></span>
              </label>

              <div className="flex gap-3 pt-4">
                <button onClick={handleSave} disabled={loadingAction} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex justify-center gap-2 items-center">
                   {loadingAction ? 'Guardando...' : <><FaSave/> Guardar Cambios</>}
                </button>
                <button onClick={() => setIsEditing(false)} disabled={loadingAction} className="px-6 border border-gray-300 rounded-lg hover:bg-gray-100 font-bold">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            /* MODO VISTA (CLIENTE) */
            <>
              <div className="mb-6">
                <span className="text-gray-400 font-bold tracking-widest text-xs uppercase">{product.type}</span>
                <h1 className="text-3xl md:text-5xl font-black uppercase italic mt-2 leading-tight">{product.name}</h1>
                
                <div className="mt-4 flex items-baseline gap-4">
                  {product.discountPrice ? (
                    <>
                      <span className="text-4xl font-light text-red-600">₡{product.discountPrice.toLocaleString()}</span>
                      <span className="text-xl text-gray-400 line-through">₡{product.price.toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="text-4xl font-light">₡{product.price.toLocaleString()}</span>
                  )}
                </div>
              </div>

              {/* Selector de Tallas (Solo Cliente) */}
              <div className="mb-8">
                <p className="font-bold text-sm mb-3 uppercase tracking-wide">Selecciona tu talla:</p>
                <div className="flex flex-wrap gap-3">
                  {tallasVisibles.map(size => {
                    const qty = product.stock?.[size] || 0;
                    return (
                      <button
                        key={size}
                        disabled={qty <= 0}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[50px] h-[50px] px-2 border border-gray-200 rounded-lg font-bold transition-all
                          ${qty <= 0 ? 'opacity-30 cursor-not-allowed bg-gray-50 decoration-slice line-through' : ''}
                          ${selectedSize === size ? 'bg-black text-white border-black ring-2 ring-offset-2 ring-black' : 'hover:border-black hover:bg-gray-50'}
                        `}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
                {!selectedSize && <p className="text-xs text-red-500 mt-2 animate-pulse">* Debes elegir una talla</p>}
              </div>

              <button 
                onClick={handleBuy}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg hover:shadow-green-200 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <FaWhatsapp size={24} /> COMPRAR AHORA
              </button>
              
              <p className="text-center text-xs text-gray-400 mt-4">
                Serás redirigido a WhatsApp para coordinar el pago y envío.
              </p>

              {/* BARRA DE ADMIN (Solo si tiene permisos) */}
              {(isSuperUser || canDelete) && (
                <div className="mt-12 pt-8 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-4 text-center">Panel de Administración</p>
                  <div className="flex gap-4">
                    {isSuperUser && (
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                      >
                        <FaEdit /> Editar Producto
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        onClick={() => setShowConfirmDelete(true)} 
                        className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
                      >
                        <FaTrash /> Eliminar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Confirmar Eliminación */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <FaTrash size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">¿Eliminar producto?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Esta acción es permanente. El producto desaparecerá del catálogo inmediatamente.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-3 border rounded-lg font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={executeDelete} className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">
                  {loadingAction ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}