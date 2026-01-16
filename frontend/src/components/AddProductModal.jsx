import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import tallaPorTipo from "../utils/tallaPorTipo";

const API_BASE = import.meta.env.VITE_API_BASE || "https://machoteprincipal.onrender.com";
const MAX_IMAGES = 2;
const MAX_WIDTH = 1000;
const QUALITY = 0.75;

// 🔹 Convierte File -> WebP
async function convertToWebpBlob(file, maxWidth = MAX_WIDTH, quality = QUALITY) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Formato no soportado"));
    i.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => {
    const tryType = "image/webp";
    canvas.toBlob(
      (b) => resolve(b),
      canvas.toDataURL(tryType).startsWith("data:image/webp") ? tryType : "image/png",
      quality
    );
  });

  if (!blob) throw new Error("No se pudo convertir la imagen");
  return blob;
}

// 🔹 Convierte src a Blob
async function srcToBlob(src) {
  if (!src) throw new Error("Imagen sin src");

  if (src.startsWith("blob:") || src.startsWith("http")) {
    const r = await fetch(src);
    if (!r.ok) throw new Error("No se pudo leer blob/url");
    return await r.blob();
  }

  if (src.startsWith("data:")) {
    const parts = src.split(",");
    if (parts.length < 2) throw new Error("dataURL inválido");
    const meta = parts[0];
    const b64 = parts[1];
    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";

    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }

  throw new Error("Formato de imagen no soportado");
}

export default function AddProductModal({ onAdd, onCancel, user }) {
  const [images, setImages] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [type, setType] = useState("Player");
  const [isNew, setIsNew] = useState(false);
  const [stock, setStock] = useState({});
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
      setImages((prev) => {
        prev.forEach((it) => it.previewUrl && URL.revokeObjectURL(it.previewUrl));
        return [];
      });
    };
  }, []);

  // 🔹 Agregar Balón al listado de tipos
  const tallas = useMemo(() => {
    const tipos = { ...tallaPorTipo, Balón: ["3", "4", "5"] };
    return tipos[type] || [];
  }, [type]);

  const handleFiles = async (filesLike) => {
    const files = Array.from(filesLike).slice(0, MAX_IMAGES - images.length);
    if (files.length === 0) return;

    try {
      setLoading(true);
      const converted = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error("Formato de imagen no soportado");
          continue;
        }
        const blob = await convertToWebpBlob(file);
        const previewUrl = URL.createObjectURL(blob);
        converted.push({ blob, previewUrl });
      }

      if (converted.length) {
        setImages((prev) => [...prev, ...converted].slice(0, MAX_IMAGES));
        toast.success("Imágenes optimizadas a WebP");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "No se pudo optimizar la imagen");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFiles([file]);
    e.target.value = "";
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const copy = prev.slice();
      const item = copy[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  // ✅ Captura de inventario
  const handleInvChange = (size, value) => {
    const num = value === "" ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setStock((prev) => ({ ...prev, [size]: num }));
  };

  // ✅ Envío de formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      if (!name.trim() || !price || !type.trim()) {
        toast.error("Completá nombre, precio y tipo.");
        return;
      }
      if (!images.length) {
        toast.error("Agregá al menos una imagen.");
        return;
      }

      const displayName = user?.username || "ChemaSportER";

      // ✅ Asegurar stock completo
      const stockFinal = Object.keys(stock).length
        ? stock
        : Object.fromEntries(tallas.map((t) => [t, 0]));

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("price", String(price).trim());
      if (discountPrice) formData.append("discountPrice", String(discountPrice).trim());
      formData.append("type", type.trim());
      formData.append("stock", JSON.stringify(stockFinal));
      formData.append("isNew", isNew ? "true" : "false");

      for (let i = 0; i < images.length; i++) {
        const blob = images[i].blob || (await srcToBlob(images[i].src));
        formData.append("images", blob, `product-${i}.webp`);
      }

      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: { "x-user": displayName },
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Error al guardar producto (${res.status}). ${txt || ""}`.trim());
      }

      const data = await res.json();
      onAdd?.(data);
      onCancel?.();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error guardando el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={modalRef}
      className="mt-28 mb-24 fixed inset-0 z-50 bg-black/40 flex items-center justify-center py-6"
    >
      <div className="pt-12 pb-24 relative bg-white p-6 rounded-lg shadow-md max-w-md w-full max-h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
        {/* Botón cerrar */}
        <button
          onClick={onCancel}
          className="absolute fondo-plateado top-6 right-2 text-white bg-black rounded p-1"
        >
          <FaTimes size={30} />
        </button>

        <h2 className="text-lg font-semibold mb-4">Agregar producto</h2>

        {/* Info imágenes */}
        <p className="text-gray-500 mb-2">
          Arrastrá y soltá hasta {MAX_IMAGES} imagen(es) o hacé clic para seleccionar (se convertirán a WebP)
        </p>

        {/* Previews */}
        <div className="flex gap-2 justify-center flex-wrap mb-3">
          {images.map((img, i) => (
            <div key={`preview-${i}`} className="relative">
              <img src={img.previewUrl} alt={`preview-${i}`} className="w-24 h-24 object-cover rounded" />
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}
                className="absolute -top-1 -right-1 text-white text-xs rounded-full px-1"
                style={{ backgroundColor: "#d4af37", color: "#000" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Input imagen */}
        {images.length < MAX_IMAGES && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 text-white border-dashed border-gray-300 p-2 rounded w-full text-center"
            >
              Seleccionar imagen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Campos básicos */}
        <input
          type="text"
          placeholder="Nombre del producto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded mb-3"
        />

        <input
          type="text"
          placeholder="Precio normal (₡)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded mb-3"
        />

        <input
          type="text"
          placeholder="Precio con descuento (opcional)"
          value={discountPrice}
          onChange={(e) => setDiscountPrice(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded mb-3"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
        >
          {Object.keys({ ...tallaPorTipo, Balón: ["3", "4", "5"] }).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Checkbox NUEVO */}
        <label className="flex items-center gap-2 mb-4 select-none">
          <input
            type="checkbox"
            checked={isNew}
            onChange={(e) => setIsNew(e.target.checked)}
          />
          <span className="text-sm">
            Mostrar etiqueta <strong>NUEVO</strong>
          </span>
        </label>

        {/* Stock */}
        

{/* Stock */}
<div className="grid grid-cols-3 gap-3 mb-6">
  {tallas.map((size) => (
    <label key={size} className="text-center">
      <span className="block mb-1 text-sm font-medium">{size}</span>
      <input
        type="number"
        min="0"
        value={stock[size] ?? ""}
        onChange={(e) => handleInvChange(size, e.target.value)}
        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
        inputMode="numeric"
      />
    </label>
  ))}
</div>


        {/* Botones */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 fondo-plateado text-black py-2 rounded hover:brightness-110 transition disabled:opacity-60"
          >
            {loading ? "Agregando..." : "Agregar producto"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border bg-red-600 text-white rounded"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
