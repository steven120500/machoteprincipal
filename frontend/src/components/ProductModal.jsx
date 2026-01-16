import { useEffect, useRef, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { FaWhatsapp, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";

// ✅ MEJORA 1: Usamos la misma lógica que en AddProduct para evitar errores de URL
const API_BASE = import.meta.env.VITE_API_URL || "https://machoteprincipal.onrender.com";

const TALLAS_ADULTO = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const TALLAS_NINO   = ['16', '18', '20', '22', '24', '26', '28'];
const TALLAS_BALON  = ['3', '4', '5'];
const ACCEPTED_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/heic'];

const MODAL_IMG_MAX_W = 800;

function transformCloudinary(url, maxW) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('res.cloudinary.com')) return url;
    const parts = u.pathname.split('/upload/');
    if (parts.length < 2) return url;
    const transforms = `f_auto,q_auto:eco,c_limit,w_${maxW},dpr_auto`;
    u.pathname = `${parts[0]}/upload/${transforms}/${parts[1]}`;
    return u.toString();
  } catch {
    return url;
  }
}

function isLikelyObjectId(v) {
  return typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);
}

export default function ProductModal({
  product,
  onClose,
  onUpdate,
  canEdit,
  canDelete,
  user,
}) {
  const modalRef = useRef(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [viewProduct, setViewProduct] = useState(product);
  const [isEditing, setIsEditing] = useState(false);

  const [editedStock,  setEditedStock]  = useState(product.stock  || {});
  const [editedName,   setEditedName]   = useState(product?.name || '');
  const [editedPrice,  setEditedPrice]  = useState(product?.price ?? 0);
  const [editedDiscountPrice, setEditedDiscountPrice] = useState(product?.discountPrice ?? '');
  const [editedType,   setEditedType]   = useState(product?.type || 'Player');
  const [editedIsNew,  setEditedIsNew]  = useState(Boolean(product?.isNew));
  const [loading,      setLoading]      = useState(false);

  const galleryFromProduct = useMemo(() => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images
        .map(i => (typeof i === 'string' ? i : i?.url))
        .filter(Boolean);
    }
    return [product?.imageSrc, product?.imageSrc2].filter(Boolean);
  }, [product]);

  const [localImages, setLocalImages] = useState(
    galleryFromProduct.map(src => ({ src, isNew: false }))
  );

  const [idx, setIdx] = useState(0);
  const hasMany = localImages.length > 1;
  const currentSrc = localImages[idx]?.src || '';

  useEffect(() => {
    setViewProduct(product);
    setEditedName(product?.name || '');
    setEditedPrice(product?.price ?? 0);
    setEditedDiscountPrice(product?.discountPrice ?? '');
    setEditedType(product?.type || 'Player');
    setEditedStock({ ...(product?.stock  || {}) });
    setEditedIsNew(Boolean(product?.isNew));
    setLocalImages(
      product?.images?.length
        ? product.images.map(img => ({ src: typeof img === 'string' ? img : img.url, isNew: false }))
        : [
            ...(product?.imageSrc  ? [{ src: product.imageSrc,  isNew: false }] : []),
            ...(product?.imageSrc2 ? [{ src: product.imageSrc2, isNew: false }] : []),
          ]
    );
    setIdx(0);
    setShowConfirmDelete(false);
  }, [product]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const handleSave = async () => {
    if (loading) return;

    const id = product?._id || product?.id;
    if (!id || !isLikelyObjectId(id)) {
      toast.error('ID de producto inválido');
      return;
    }

    try {
      setLoading(true);
      const displayName = user?.username || user?.email || 'FutStore';

      const priceInt = Math.max(0, parseInt(editedPrice, 10) || 0);
      let discountInt = null;
      if (editedDiscountPrice !== '' && !isNaN(Number(editedDiscountPrice))) {
        const val = parseInt(editedDiscountPrice, 10);
        if (val > 0) discountInt = val;
      }

      const clean = (obj) =>
        Object.fromEntries(
          Object.entries(obj || {}).map(([k, v]) => [k, Math.max(0, parseInt(v, 10) || 0)])
        );

      const payload = {
        name: (editedName || '').trim(),
        price: priceInt,
        discountPrice: discountInt,
        type: (editedType || '').trim(),
        stock:  clean(editedStock),
        images: localImages.map(i => i?.src).filter(Boolean),
        imageSrc:  localImages[0]?.src || null,
        imageSrc2: localImages[1]?.src || null,
        imageAlt: (editedName || '').trim(),
        isNew: !!editedIsNew,
      };

      const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user': displayName,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      const updated = await res.json();
      setViewProduct(updated);
      onUpdate?.(updated);
      setIsEditing(false);
      toast.success('Producto actualizado');
      
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (loading) return;
    
    const id = product?._id || product?.id;
    if (!id || !isLikelyObjectId(id)) {
      toast.error('ID inválido, no se puede eliminar');
      setShowConfirmDelete(false); 
      return;
    }

    try {
      setLoading(true);
      const displayName = user?.username || 'FutStore';
      
      const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user': displayName },
      });
      
      // ✅ MEJORA 2: Leemos el error real del backend si falla
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${res.status} al eliminar`);
      }
      
      toast.success('Producto eliminado correctamente');
      onUpdate?.(null, id);
      onClose?.();

    } catch (err) {
      console.error("Error eliminando:", err);
      // ✅ MEJORA 3: Mostramos el error real en el toast
      toast.error(err.message || 'No se pudo eliminar');
    } finally {
      setLoading(false);
      setShowConfirmDelete(false); 
    }
  };

  const handleStockChange = (size, value) => {
    setEditedStock(prev => ({ ...prev, [size]: parseInt(value, 10) || 0 }));
  };

  const handleImageChange = (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Formato no soportado');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLocalImages(prev => {
        const copy = prev.slice();
        if (index >= copy.length) copy.push({ src: reader.result, isNew: true });
        else copy[index] = { src: reader.result, isNew: true };
        return copy;
      });
      setIdx(index);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (index) => {
    setLocalImages(prev => {
      const copy = prev.slice();
      copy.splice(index, 1);
      return copy;
    });
    setIdx(0);
  };

  const isNino  = (isEditing ? editedType : viewProduct?.type) === 'Niño';
  const isBalon = (isEditing ? editedType : viewProduct?.type) === 'Balón';

  const tallasVisibles = isBalon
    ? TALLAS_BALON
    : isNino
    ? TALLAS_NINO
    : TALLAS_ADULTO;

  const displayUrl = currentSrc ? transformCloudinary(currentSrc, MODAL_IMG_MAX_W) : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-10 mb-16 fixed inset-0 z-50 bg-black/40 flex items-center justify-center py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()} 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative pt-12 pb-24 bg-white p-6 rounded-lg shadow-md max-w-md w-full max-h-screen overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute fondo-plateado mr-2 top-12 right-2 text-black bg-black rounded p-1"
          title="Cerrar"
        >
          <FaTimes size={30} />
        </button>

        <div className="mt-16 mb-2 text-left">
          {isEditing && canEdit ? (
            <>
              <label className="text-sm text-gray-500">Tipo</label>
              <select
                value={editedType}
                onChange={(e) => setEditedType(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-3"
              >
                {['Player','Fan','Mujer','Nacional','Abrigos','Retro','Niño','Balón'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <label className="text-sm text-gray-500">Nombre</label>
              <input
                type="text"
                className="w-full border px-2 py-1 mb-3"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
              />

              <label className="text-sm text-gray-500">Precio normal</label>
              <input
                type="number"
                className="w-full border px-2 py-1 mb-3"
                value={editedPrice}
                onChange={(e) => setEditedPrice(e.target.value)}
              />

              <label className="text-sm text-gray-500">Precio descuento (opcional)</label>
              <input
                type="number"
                className="w-full border px-2 py-1 mb-3"
                value={editedDiscountPrice}
                onChange={(e) => setEditedDiscountPrice(e.target.value)}
                placeholder="Dejar vacío si no tiene"
              />

              <label className="flex items-center gap-2 mt-1 mb-3 select-none">
                <input
                  type="checkbox"
                  checked={editedIsNew}
                  onChange={(e) => setEditedIsNew(e.target.checked)}
                />
                <span className="text-sm">Mostrar etiqueta <strong>NUEVO</strong></span>
              </label>
            </>
          ) : (
            <>
              <span className="block text-xs uppercase text-gray-500">{viewProduct?.type}</span>
              <h2 className="text-xl font-extrabold" style={{ color: '#9E8F91' }}>
                {viewProduct?.name}
              </h2>
            </>
          )}
        </div>

        {!isEditing ? (
          <div className="relative mb-4 flex items-center justify-center h-[400px] overflow-hidden">
            <AnimatePresence mode="wait">
              {displayUrl ? (
                <motion.img
                  key={displayUrl}
                  src={displayUrl}
                  alt={viewProduct?.name}
                  className="rounded max-h-[400px] object-contain cursor-grab active:cursor-grabbing"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  loading="eager"
                  draggable="false"
                />
              ) : (
                <div className="h-[300px] w-full grid place-items-center text-gray-400">
                  Sin imagen
                </div>
              )}
            </AnimatePresence>

            {hasMany && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIdx(i => (i - 1 + localImages.length) % localImages.length);
                  }}
                  className="absolute left-2 z-10 fondo-plateado hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                >
                  <FaChevronLeft size={20}/>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIdx(i => (i + 1) % localImages.length);
                  }}
                  className="absolute right-2 z-10 fondo-plateado hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm"
                >
                  <FaChevronRight size={20}/>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex gap-4 justify-center flex-wrap mb-4">
            {localImages.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.src} alt="" className="h-48 object-contain"/>
                <button onClick={() => handleImageRemove(i)}
                  className="absolute top-0 right-0 bg-black text-white rounded-full p-1">
                  <FaTimes />
                </button>
                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, i)} />
              </div>
            ))}
            {localImages.length < 2 && (
              <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, localImages.length)} />
            )}
          </div>
        )}

        {!isEditing && (
          <div className="mt-2 text-right">
            {viewProduct?.discountPrice ? (
              <>
                <p className="text-sm text-gray-500 line-through">
                  ₡{Number(viewProduct?.price).toLocaleString('de-DE')}
                </p>
                <p className="text-lg font-bold text-red-600">
                  ₡{Number(viewProduct?.discountPrice).toLocaleString('de-DE')}
                </p>
              </>
            ) : (
              <p className="text-lg font-bold">
                ₡{Number(viewProduct?.price).toLocaleString('de-DE')}
              </p>
            )}
          </div>
        )}

        <div className="mt-4">
          <p className="font-semibold mb-2">Stock por talla:</p>
          {tallasVisibles.map((talla) => (
            <div key={talla} className="flex justify-between items-center border rounded px-2 py-1 mb-1 text-[#d4af37]">
              <span>{talla}</span>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  className="w-16 border text-center"
                  value={editedStock[talla] ?? ''}
                  onChange={(e) => handleStockChange(talla, e.target.value)}
                />
              ) : (
                <span>{viewProduct?.stock?.[talla] || 0}</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {canEdit && isEditing ? (
            <button className="col-span-2 bg-green-600 text-white py-2 rounded" onClick={handleSave}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          ) : canEdit && (
            <button className="bg-blue-600 text-white py-2 rounded" onClick={() => setIsEditing(true)}>
              Editar
            </button>
          )}
          {canDelete && (
            <button 
                className="bg-red-600 text-white py-2 rounded hover:bg-red-700 transition" 
                onClick={() => setShowConfirmDelete(true)}
            >
              Eliminar
            </button>
          )}
        </div>

        <a
          href={`https://wa.me/50672327096?text=${encodeURIComponent(
            `👋 ¡Hola! Me interesa el producto:

🛒 *${product?.name}* (${product?.type})

💰 *Precio:* ₡${product?.discountPrice > 0 ? product.discountPrice : product.price}

📸 *Imagen:* ${product?.imageSrc || ""}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block bg-green-600 text-white py-2 rounded text-center font-bold hover:bg-green-700 transition"
        >
          <FaWhatsapp className="inline mr-2" />
          Enviar mensaje por WhatsApp
        </a>

        {showConfirmDelete && (
          <div className="absolute bottom-3 left-0 right-0 bg-black/60 flex items-center justify-center z-50 rounded-lg backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-6 rounded-xl shadow-2xl text-center max-w-xs mx-4 border-2 border-red-100"
            >
              <FaTimes className="mx-auto text-red-500 mb-3" size={40} />
              <h3 className="text-xl font-bold mb-2 text-gray-800">¿Estás seguro?</h3>
              <p className="text-gray-600 mb-6 text-sm">
                ¿Quieres eliminar este producto permanentemente? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition flex items-center"
                  disabled={loading}
                >
                  {loading ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </motion.div>
    </motion.div>
  );
}