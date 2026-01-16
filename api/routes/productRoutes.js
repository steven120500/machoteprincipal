import express from 'express';
import Product from '../models/Product.js';
import History from '../models/History.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';

const router = express.Router();

/* ================= Multer ================= */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ================= Helpers ================= */
const ADULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const KID_SIZES = ['16', '18', '20', '22', '24', '26', '28'];
const BALL_SIZES = ['3', '4', '5'];
const ALL_SIZES = new Set([...ADULT_SIZES, ...KID_SIZES, ...BALL_SIZES]);

function whoDidIt(req) {
  return (
    req.user?.name ||
    req.user?.email ||
    req.headers['x-user'] ||
    req.body.user ||
    'Sistema'
  );
}

function diffInv(label, prev = {}, next = {}) {
  const sizes = new Set([
    ...(Object.keys(prev || {})),
    ...(Object.keys(next || {})),
  ]);
  const out = [];
  for (const s of sizes) {
    const a = Number(prev?.[s] ?? 0);
    const b = Number(next?.[s] ?? 0);
    if (a !== b) out.push(`${label}[${s}]: ${a} -> ${b}`);
  }
  return out;
}

function diffProduct(prev, next) {
  const ch = [];
  if (prev.name !== next.name) ch.push(`nombre: "${prev.name}" -> "${next.name}"`);
  if (prev.price !== next.price) ch.push(`precio: ${prev.price} -> ${next.price}`);
  if (prev.discountPrice !== next.discountPrice) ch.push(`precio oferta: ${prev.discountPrice} -> ${next.discountPrice}`);
  if (prev.type !== next.type) ch.push(`tipo: "${prev.type}" -> "${next.type}"`);
  if (prev.isNew !== next.isNew) ch.push(`nuevo: ${prev.isNew} -> ${next.isNew}`);
  ch.push(...diffInv('stock', prev.stock, next.stock));
  ch.push(...diffInv('bodega', prev.bodega, next.bodega));
  return ch;
}

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'products', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

function sanitizeInv(obj) {
  const clean = {};
  for (const [size, qty] of Object.entries(obj || {})) {
    if (!ALL_SIZES.has(String(size))) continue;
    const n = Math.max(0, Math.trunc(Number(qty) || 0));
    clean[size] = n;
  }
  return clean;
}

/* ================= Rutas ================= */

/** Crear producto */
router.post('/', upload.any(), async (req, res) => {
  try {
    const files = (req.files || []).filter(
      (f) => f.fieldname === 'images' || f.fieldname === 'image'
    );
    // Nota: Quitamos la restricción estricta de imágenes para pruebas, 
    // pero si es obligatorio, descomenta la siguiente línea:
    // if (!files.length) return res.status(400).json({ error: 'No se enviaron imágenes' });

    const uploaded = await Promise.all(
      files.map((f) => uploadToCloudinary(f.buffer))
    );
    const images = uploaded.map((u) => ({
      public_id: u.public_id,
      url: u.secure_url,
    }));
    const imageSrc = images[0]?.url || '';

    // stock y bodega logic
    let stock = {};
    try {
      if (typeof req.body.stock === 'string') stock = JSON.parse(req.body.stock);
      else if (typeof req.body.sizes === 'string') stock = JSON.parse(req.body.sizes);
      else if (typeof req.body.stock === 'object') stock = req.body.stock;
    } catch { stock = {}; }
    const cleanStock = sanitizeInv(stock);

    let bodega = {};
    try {
      if (typeof req.body.bodega === 'string') bodega = JSON.parse(req.body.bodega);
      else if (typeof req.body.bodega === 'object') bodega = req.body.bodega;
    } catch { bodega = {}; }
    const cleanBodega = sanitizeInv(bodega);

    const isNew = req.body.isNew === 'true' || req.body.isNew === true || req.body.isNew === 'on';

    const product = await Product.create({
      name: String(req.body.name || '').trim(),
      price: Number(req.body.price),
      discountPrice: req.body.discountPrice ? Number(req.body.discountPrice) : null,
      type: String(req.body.type || '').trim(),
      stock: cleanStock,
      bodega: cleanBodega,
      imageSrc,
      images,
      isNew,
    });

    await History.create({
      user: whoDidIt(req),
      action: 'creó producto',
      item: `${product.name} (${product.type})`,
      date: new Date(),
      details: `img principal: ${imageSrc}`,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('POST /api/products error:', err);
    res.status(500).json({ error: err.message || 'Error al crear producto' });
  }
});

/** Actualizar producto */
router.put('/:id', async (req, res) => {
  try {
    const prev = await Product.findById(req.params.id).lean();
    if (!prev) return res.status(404).json({ error: 'Producto no encontrado' });

    // Parsing logic...
    let incomingStock = req.body.stock;
    if (typeof incomingStock === 'string') { try { incomingStock = JSON.parse(incomingStock); } catch {} }
    let nextStock = prev.stock;
    if (incomingStock && typeof incomingStock === 'object') nextStock = sanitizeInv(incomingStock);

    let incomingBodega = req.body.bodega;
    if (typeof incomingBodega === 'string') { try { incomingBodega = JSON.parse(incomingBodega); } catch {} }
    let nextBodega = prev.bodega || {};
    if (incomingBodega && typeof incomingBodega === 'object') nextBodega = sanitizeInv(incomingBodega);

    const update = {
      name: req.body.name ? req.body.name.trim().slice(0, 150) : prev.name,
      type: req.body.type ? req.body.type.trim().slice(0, 40) : prev.type,
      price: Number(req.body.price) || prev.price,
      discountPrice: (req.body.discountPrice !== undefined && req.body.discountPrice !== '') ? Number(req.body.discountPrice) : prev.discountPrice,
      stock: nextStock,
      bodega: nextBodega,
    };

    if (req.body.isNew !== undefined) {
      update.isNew = req.body.isNew === 'true' || req.body.isNew === true || req.body.isNew === 'on';
    }

    // Imágenes logic...
    if (req.body.imageSrc !== undefined) update.imageSrc = req.body.imageSrc || '';
    if (req.body.imageSrc2 !== undefined) update.imageSrc2 = req.body.imageSrc2 || '';
    if (req.body.imageAlt !== undefined) update.imageAlt = req.body.imageAlt || '';

    let incomingImages = req.body.images;
    if (typeof incomingImages === 'string') { try { incomingImages = JSON.parse(incomingImages); } catch {} }

    if (Array.isArray(incomingImages)) {
      // (Lógica de imágenes igual a la original...)
      const prevList = prev.images || [];
      const normalized = [];
      for (const raw of incomingImages.slice(0, 2)) {
        if (!raw) continue;
        if (typeof raw === 'string' && raw.startsWith('data:')) {
          const up = await cloudinary.uploader.upload(raw, { folder: 'products', resource_type: 'image' });
          normalized.push({ public_id: up.public_id, url: up.secure_url });
        } else if (typeof raw === 'string') {
          const found = prevList.find((i) => i.url === raw);
          normalized.push(found ? { public_id: found.public_id, url: found.url } : { public_id: null, url: raw });
        } else if (raw && typeof raw === 'object' && raw.url) {
          normalized.push({ public_id: raw.public_id || null, url: raw.url });
        }
      }
      update.images = normalized;
      update.imageSrc = normalized[0]?.url || '';
      update.imageSrc2 = normalized[1]?.url || '';
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    
    // History...
    const changes = diffProduct(prev, updated.toObject());
    if (changes.length) {
      await History.create({
        user: whoDidIt(req),
        action: 'actualizó producto',
        item: `${updated.name} (${updated.type})`,
        date: new Date(),
        details: changes.join(' | '),
      });
    }
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/products/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

/** Eliminar producto */
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    for (const img of product.images || []) {
      if (img.public_id) { try { await cloudinary.uploader.destroy(img.public_id); } catch {} }
    }
    await product.deleteOne();

    await History.create({
      user: whoDidIt(req),
      action: 'eliminó producto',
      item: `${product.name} (${product.type})`,
      date: new Date(),
      details: `imagenes borradas: ${product.images?.length || 0}`,
    });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('DELETE /api/products/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

/** Listado paginado (MEJORADO PARA DEBUGGING) */
router.get('/', async (req, res) => {
  try {
    // Logs para ver en Render si llega la petición
    console.log('📡 GET /api/products - Iniciando consulta...');

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const q = (req.query.q || '').trim();
    const type = (req.query.type || '').trim();
    const sizes = (req.query.sizes || '').trim();
    const mode = (req.query.mode || '').trim();

    const find = {};
    if (q) find.name = { $regex: q, $options: 'i' };

    if (type === 'Ofertas') {
      find.discountPrice = { $ne: null, $gt: 0 };
    } else if (mode === 'disponibles') {
      find.$and = [
        { $or: [{ discountPrice: { $exists: false } }, { discountPrice: null }, { discountPrice: 0 }] },
        { $expr: { $gt: [{ $sum: { $map: { input: { $objectToArray: '$stock' }, as: 's', in: '$$s.v' } } }, 0] } },
      ];
    } else if (type) {
      find.type = type;
    }

    if (sizes) {
      const sizesArray = sizes.split(',').map((s) => s.trim()).filter(Boolean);
      if (sizesArray.length > 0) {
        find.$or = sizesArray.map((size) => ({ [`stock.${size}`]: { $gt: 0 } }));
      }
    }

    const projection = 'name price discountPrice type imageSrc images stock bodega createdAt isNew';

    const [items, total] = await Promise.all([
      Product.find(find).select(projection).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(find),
    ]);

    console.log(`✅ Consulta exitosa. Productos encontrados: ${total}`);

    res.set('Cache-Control', 'public, max-age=20');
    res.json({
      items: items || [], // Asegura que siempre sea array
      total: total || 0,
      page,
      pages: limit > 0 ? Math.ceil(total / limit) : 0,
      limit,
    });
  } catch (err) {
    console.error('❌ CRITICAL ERROR GET /api/products:', err);
    res.status(500).json({ error: 'Error al obtener los productos', details: err.message });
  }
});

/** Health check */
router.get('/health', async (_req, res) => {
  try {
    const count = await Product.countDocuments();
    res.json({ ok: true, count });
  } catch {
    res.status(500).json({ ok: false });
  }
});

export default router;