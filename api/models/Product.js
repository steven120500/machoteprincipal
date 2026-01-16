// models/Product.js
import mongoose from "mongoose";

// ===== Tallas =====
const ADULT_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL"];
const KID_SIZES = ["16", "18", "20", "22", "24", "26", "28"];
const BALL_SIZES = ["3", "4", "5"]; // ⚽ Tallas de balones

// 🔹 Unificamos todas las tallas válidas
const ALL_SIZES = new Set([...ADULT_SIZES, ...KID_SIZES, ...BALL_SIZES]);

// ===== Validadores =====
const imageAnyValidator = {
  validator(v) {
    if (v == null) return true;
    if (typeof v !== "string") return false;

    const isData = /^data:image\/(png|jpe?g|webp|heic|heif);base64,/i.test(v);
    const isHttp = /^https?:\/\/\S+/i.test(v);

    return isData || isHttp;
  },
  message:
    "Imagen inválida: debe ser data URL base64 o una URL http(s).",
};

const stockValidator = {
  validator(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    for (const [size, qty] of Object.entries(obj)) {
      // 🔹 Ahora incluye tallas de balón
      if (!ALL_SIZES.has(String(size))) return false;
      const n = Number(qty);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return false;
    }
    return true;
  },
  message:
    "Inventario inválido. Debe ser un objeto { talla: cantidad>=0 } con tallas válidas.",
};

// ===== Sub-esquema para imágenes =====
const ImageSchema = new mongoose.Schema(
  {
    public_id: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

// ===== Schema principal =====
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    price: { type: Number, required: true, min: 0 },

    // 👇 Precio de descuento opcional
    discountPrice: { type: Number, min: 0, default: null },

    imageSrc: {
      type: String,
      trim: true,
      maxlength: 600,
      validate: imageAnyValidator,
    },
    images: { type: [ImageSchema], default: [] },

    stock: { type: Object, required: true, validate: stockValidator },
    bodega: { type: Object, default: {} },

    // 🔹 Tipo de producto (Player, Fan, Mujer, Niño, Retro, Balón, etc.)
    type: { type: String, required: true, trim: true, maxlength: 40 },

    // 👇 Campo adicional para mostrar etiqueta “NUEVO”
    isNew: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ===== Hooks =====
productSchema.pre("validate", function (next) {
  // 🔹 Normalizamos precio
  if (typeof this.price === "number" && Number.isFinite(this.price)) {
    this.price = Math.trunc(this.price);
  }

  // 👇 Si discountPrice está vacío, lo dejamos en null en vez de 0
  if (this.discountPrice == null || this.discountPrice === "") {
    this.discountPrice = null;
  } else if (
    typeof this.discountPrice === "number" &&
    Number.isFinite(this.discountPrice)
  ) {
    this.discountPrice = Math.trunc(this.discountPrice);
    if (this.discountPrice <= 0) this.discountPrice = null; // evita guardar 0
  }

  // ✅ Si es un balón y el stock está vacío, se rellenan las tallas por defecto
  if (
    this.type &&
    ["balón", "balon"].includes(this.type.toLowerCase()) &&
    (!this.stock || Object.keys(this.stock).length === 0)
  ) {
    this.stock = { "3": 0, "4": 0, "5": 0 };
  }

  next();
});

// ===== Índices =====
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 1 });
productSchema.index({ type: 1 });
productSchema.index({ price: 1, createdAt: -1 });
productSchema.index({ discountPrice: 1 });
productSchema.index({ isNew: 1 }); // 👈 índice para búsquedas futuras

// ===== Limpieza de salida =====
productSchema.set("toJSON", {
  virtuals: false,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

productSchema.set("toObject", { virtuals: false, versionKey: false });
productSchema.set("minimize", true);
productSchema.set("strictQuery", true);

export default mongoose.model("Product", productSchema);
