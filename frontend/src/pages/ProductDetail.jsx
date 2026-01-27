import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaWhatsapp, FaTimes, FaChevronLeft, FaChevronRight, FaEdit, FaTrash, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from '../context/CartContext';

const API_BASE = "https://machoteprincipal.onrender.com";
const TALLAS_ADULTO = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const TALLAS_NINO   = ['16', '18', '20', '22', '24', '26', '28'];
const TALLAS_BALON  = ['3', '4', '5'];
const ACCEPTED_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/heic'];
const PLACEHOLDER_IMG = "https://via.placeholder.com/600x600?text=No+Image";

export default function ProductDetail({ user, onUpdate }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [idx, setIdx] = useState(0); 
  const [showDecisionModal, setShowDecisionModal] = useState(false); // 👈 NUEVO

  const [isEditing, setIsEditing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [editedName, setEditedName] = useState('');
  const [editedPrice, setEditedPrice] = useState(0);
  const [editedDiscountPrice, setEditedDiscountPrice] = useState('');
  const [editedType, setEditedType] = useState('Player');
  const [editedStock, setEditedStock] = useState({});
  const [editedIsNew, setEditedIsNew] = useState(false);
  const [localImages, setLocalImages] = useState([]);

  const isSuperUser = user?.isSuperUser || user?.roles?.includes("edit");
  const canDelete = user?.isSuperUser || user?.roles?.includes("delete");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) throw new Error("Producto no encontrado");
        const data = await res.json();
        setProduct(data);
        syncEditState(data);
      } catch (err) {
        console.error(err);
        toast.error("Error cargando producto");
      } finally {
        setLoadingFetch(false);
      }
    };
    fetchProduct();
  }, [id]);

  const syncEditState = (data) => {
    setEditedName(data.name || '');
    setEditedPrice(data.price ?? 0);
    setEditedDiscountPrice(data.discountPrice ?? '');
    setEditedType(data.type || 'Player');
    setEditedStock({ ...(data.stock || {}) });
    setEditedIsNew(Boolean(data.isNew));
    
    let imgs = [];
    if (Array.isArray(data.images) && data.images.length > 0) {
      imgs = data.images.map(img => (typeof img === 'object' ? img.url : img)).filter(url => url && url.startsWith('http'));
    }
    if (imgs.length === 0 && data.imageSrc && data.imageSrc.startsWith('http')) {
      imgs.push(data.imageSrc);
      if (data.imageSrc2 && data.imageSrc2.startsWith('http')) imgs.push(data.imageSrc2);
    }
    if (imgs.length === 0) imgs.push(PLACEHOLDER_IMG);
    setLocalImages(imgs.map(src => ({ src, isNew: false })));
  };

  const handleSave = async () => {
    if (loadingAction) return;
    setLoadingAction(true);
    try {
      const displayName = user?.username || 'Admin';
      const cleanStock = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, Math.max(0, parseInt(v, 10) || 0)]));
      const payload = {
        name: editedName.trim(),
        price: parseInt(editedPrice, 10) || 0,
        discountPrice: editedDiscountPrice ? parseInt(editedDiscountPrice, 10) : null,
        type: editedType,
        stock: cleanStock(editedStock),
        images: localImages.map(i => i.src), 
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
      syncEditState(updated);
      setIsEditing(false);
      if (onUpdate) onUpdate(updated);
      toast.success("Guardado correctamente");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

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
      if (onUpdate) onUpdate(null, id);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setShowConfirmDelete(false);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleImageChange = (e, index) => {
    const file = e.target.files?.[0];
    if (!file || !ACCEPTED_TYPES.includes(file.type)) return toast.error("Formato inválido");
    const reader = new FileReader();
    reader.onload = () => {
      setLocalImages(prev => {
        const copy = [...prev];
        if (copy.length === 1 && copy[0].src === PLACEHOLDER_IMG) {
           return [{ src: reader.result, isNew: true }];
        }
        if (index >= copy.length) copy.push({ src: reader.result, isNew: true });
        else copy[index] = { src: reader.result, isNew: true };
        return copy;
      });
      setIdx(index);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (index) => {
    const newImages = localImages.filter((_, i) => i !== index);
    if (newImages.length === 0) newImages.push({ src: PLACEHOLDER_IMG, isNew: false });
    setLocalImages(newImages);
    setIdx(0);
  };

  const handleBuyWhatsApp = () => {
    if (!selectedSize) return toast.warning("Por favor, selecciona una talla.");
    const precioFinal = product.discountPrice || product.price;
    const mensaje = `👋 ¡Hola! Quiero comprar: *${product.name}* (Talla: ${selectedSize}) - ₡${precioFinal}`;
    window.open(`https://wa.me/50672327096?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleAddToCart = () => {
    if (!selectedSize) return toast.warning("Selecciona una talla primero");
    addToCart(product, selectedSize);
    setShowDecisionModal(true); // 👈 AQUÍ SE ABRE EL MODAL
  };

  if (loadingFetch) return <div className="h-screen flex items-center justify-center font-bold text-xl">Cargando...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Producto no encontrado</div>;

  const currentSrc = localImages[idx]?.src || PLACEHOLDER_IMG;
  const currentType = isEditing ? editedType : product.type;
  const tallasVisibles = currentType === 'Balón' ? TALLAS_BALON : (currentType === 'Niño' ? TALLAS_NINO : TALLAS_ADULTO);
  const stockRestante = selectedSize ? (isEditing ? editedStock[selectedSize] : product.stock?.[selectedSize]) : 0;

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black transition font-medium">
        <FaArrowLeft /> Volver al catálogo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* FOTOS */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center shadow-sm group">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentSrc}
                src={currentSrc}
                onError={(e) => { e.target.src = PLACEHOLDER_IMG; e.target.onerror = null; }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full h-full object-contain p-2"
              />
            </AnimatePresence>
            {!isEditing && localImages.length > 1 && (
              <>
                <button onClick={() => setIdx((i) => (i - 1 + localImages.length) % localImages.length)} className="absolute left-4 bg-white/90 p-3 rounded-full shadow hover:scale-110 transition opacity-0 group-hover:opacity-100"><FaChevronLeft /></button>
                <button onClick={() => setIdx((i) => (i + 1) % localImages.length)} className="absolute right-4 bg-white/90 p-3 rounded-full shadow hover:scale-110 transition opacity-0 group-hover:opacity-100"><FaChevronRight /></button>
              </>
            )}
          </div>
          {localImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {localImages.map((img, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={img.src} onClick={() => setIdx(i)} onError={(e) => e.target.src = PLACEHOLDER_IMG}
                    className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 transition ${idx === i ? 'border-black' : 'border-gray-100'}`} 
                  />
                  {isEditing && <button onClick={() => handleImageRemove(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"><FaTimes /></button>}
                </div>
              ))}
            </div>
          )}
          {isEditing && localImages.length < 5 && (
            <div className="mt-2">
                 <label className="w-full h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-black text-gray-500 hover:text-black transition gap-2">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, localImages.length)} />
                  <span className="text-sm font-bold">+ AÑADIR FOTO</span>
                </label>
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="flex flex-col">
          {isEditing ? (
             <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FaEdit/> Editando Producto</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-gray-500">NOMBRE</label>
                        <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="w-full border p-2 rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-gray-500">TIPO</label>
                            <select value={editedType} onChange={e => setEditedType(e.target.value)} className="w-full border p-2 rounded">
                                {['Player','Fan','Mujer','Nacional','Abrigos','Retro','Niño','Balón'].map(t => <option key={t}>{t}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="text-xs font-bold text-gray-500">NUEVO</label>
                            <div className="flex items-center h-full">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={editedIsNew} onChange={e => setEditedIsNew(e.target.checked)} />
                                    <span className="text-sm">¿Etiqueta Nuevo?</span>
                                </label>
                            </div>
                         </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-gray-500">PRECIO</label>
                            <input type="number" value={editedPrice} onChange={e => setEditedPrice(e.target.value)} className="w-full border p-2 rounded" />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-gray-500">OFERTA (Opcional)</label>
                            <input type="number" value={editedDiscountPrice} onChange={e => setEditedDiscountPrice(e.target.value)} className="w-full border p-2 rounded" placeholder="0" />
                         </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded border">
                  <p className="text-xs font-bold mb-2 uppercase text-center">Inventario por Talla</p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {tallasVisibles.map(t => (
                      <div key={t} className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 font-bold">{t}</span>
                        <input type="number" className="w-full border text-center p-1 rounded text-sm focus:border-black outline-none" 
                               value={editedStock[t] ?? 0} 
                               onChange={(e) => setEditedStock(prev => ({ ...prev, [t]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button onClick={handleSave} disabled={loadingAction} className="flex-1 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition">
                      {loadingAction ? 'Guardando...' : 'GUARDAR CAMBIOS'}
                  </button>
                  <button onClick={() => setIsEditing(false)} disabled={loadingAction} className="px-4 border border-gray-300 rounded-lg font-bold hover:bg-gray-100">CANCELAR</button>
                </div>
             </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 font-bold text-[10px] uppercase rounded tracking-widest">{product.type}</span>
                    {product.isNew && <span className="px-2 py-1 bg-black text-white font-bold text-[10px] uppercase rounded tracking-widest">NUEVO</span>}
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase italic leading-tight">{product.name}</h1>
                <div className="mt-4 flex items-baseline gap-3">
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

              <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-bold text-xs mb-3 uppercase tracking-wide text-gray-500">Selecciona tu talla:</p>
                <div className="flex flex-wrap gap-2">
                  {tallasVisibles.map(size => {
                    const qty = product.stock?.[size] || 0;
                    return (
                      <button
                        key={size}
                        disabled={qty <= 0}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[45px] h-[45px] px-2 border rounded-lg font-bold text-sm transition-all relative
                          ${qty <= 0 ? 'opacity-30 cursor-not-allowed bg-gray-100 border-gray-200 line-through text-gray-400' : ''}
                          ${selectedSize === size ? 'bg-black text-white border-black shadow-md transform scale-105' : 'bg-white border-gray-200 hover:border-black hover:shadow-sm'}
                        `}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
                <AnimatePresence>
                  {selectedSize && stockRestante > 0 && stockRestante < 15 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 flex items-center gap-2 text-orange-600 bg-orange-50 p-2 rounded-md border border-orange-100">
                      <span className="text-lg">🔥</span>
                      <p className="font-bold text-xs">¡Date prisa! Solo quedan <span className="text-base">{stockRestante}</span> unidades en talla {selectedSize}.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={handleAddToCart} className="w-full bg-black text-white py-4 rounded-xl font-black text-lg hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]">
                  <FaShoppingCart /> AÑADIR AL CARRITO
                </button>
                <button onClick={handleBuyWhatsApp} className="w-full bg-green-600 text-white py-4 rounded-xl font-black text-lg hover:bg-green-700 transition shadow-lg shadow-green-100 flex items-center justify-center gap-3 active:scale-[0.98]">
                  <FaWhatsapp size={26} /> COMPRAR DIRECTO
                </button>
              </div>

              {(isSuperUser || canDelete) && (
                <div className="mt-12 pt-6 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 text-center tracking-widest">Zona Administrativa</p>
                  <div className="flex gap-3">
                    {isSuperUser && <button onClick={() => setIsEditing(true)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-sm"><FaEdit /> EDITAR</button>}
                    {canDelete && <button onClick={() => setShowConfirmDelete(true)} className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 text-sm"><FaTrash /> ELIMINAR</button>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* --- MODAL DE DECISIÓN --- */}
      <AnimatePresence>
        {showDecisionModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShoppingCart size={30} />
              </div>
              <h3 className="text-xl font-black italic uppercase mb-2">¡Agregado al carrito!</h3>
              <p className="text-gray-500 text-sm mb-6">¿Qué te gustaría hacer ahora?</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/checkout')} 
                  className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition"
                >
                  FINALIZAR COMPRA
                </button>
                <button 
                  onClick={() => { setShowDecisionModal(false); navigate('/'); }} 
                  className="w-full bg-white text-black border-2 border-black py-3 rounded-xl font-bold hover:bg-gray-50 transition"
                >
                  SEGUIR VIENDO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal Confirm Delete */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-xs w-full text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><FaTrash size={24} /></div>
              <h3 className="text-lg font-bold mb-2">¿Eliminar producto?</h3>
              <p className="text-gray-500 text-xs mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-2 border rounded-lg font-bold text-sm">Cancelar</button>
                <button onClick={executeDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700">{loadingAction ? '...' : 'Eliminar'}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}