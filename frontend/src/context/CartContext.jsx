import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de un CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('futstore_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('futstore_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, size) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => (item._id || item.id) === (product._id || product.id) && item.selectedSize === size
      );

      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        // toast.success(`Otra unidad agregada: ${product.name}`); // Opcional
        return newCart;
      } else {
        // toast.success(`Agregado al carrito 🛒`); // Opcional
        return [...prev, { ...product, selectedSize: size, quantity: 1 }];
      }
    });
    // ❌ COMENTADO PARA QUE NO ABRA EL DRAWER AUTOMÁTICAMENTE
    // setIsCartOpen(true); 
  };

  const removeFromCart = (id, size) => {
    setCart((prev) => prev.filter((item) => !((item._id || item.id) === id && item.selectedSize === size)));
  };
  
  const updateQuantity = (id, size, amount) => {
     setCart(prev => prev.map(item => {
        if ((item._id || item.id) === id && item.selectedSize === size) {
           return { ...item, quantity: Math.max(1, item.quantity + amount) };
        }
        return item;
     }));
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((acc, item) => {
    const price = item.discountPrice || item.price;
    return acc + (price * item.quantity);
  }, 0);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, toggleCart, isCartOpen, setIsCartOpen, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};