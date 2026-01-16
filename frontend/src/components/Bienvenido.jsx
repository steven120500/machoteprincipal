import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 📦 DATOS DEL CARRUSEL (Las camisetas que rotan)
const slides = [
  {
    id: 1,
    image: "/RetroB.png",
    title: "Ver Retros",
    eventName: "filtrarRetros"
  },
  {
    id: 2,
    image: "/PlayerB.png",
    title: "Ver Player",
    eventName: "filtrarPlayer"
  },
  {
    id: 3,
    image: "/FanB.png",
    title: "Ver Fan",
    eventName: "filtrarFan"
  },
  {
    id: 4,
    image: "/NacionalB.png",
    title: "Ver Nacional",
    eventName: "filtrarNacional"
  }
];

export default function Bienvenido() {
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // 1. DETECTAR SI ES MÓVIL O PC (Para elegir el fondo correcto)
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize(); // Chequear al cargar
    window.addEventListener("resize", checkSize); // Chequear si cambian el tamaño
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // 2. ROTACIÓN AUTOMÁTICA (Cada 4 segundos)
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // 3. FUNCIÓN DE NAVEGACIÓN
  const handleNavigation = () => {
    const currentSlide = slides[index];
    window.dispatchEvent(new CustomEvent(currentSlide.eventName));
  };

  return (
    <section className="relative  md:top-0 w-full h-full sm:min-h-screen flex flex-col items-center justify-center overflow-hidden">
      
      {/* 🖼️ FONDO RESPONSIVE (NUEVO) */}
      {/* Aquí usamos tus nuevas imágenes: FondoM para móvil, FondoD para escritorio */}
      <div className="absolute inset-0 z-0">
        <img
          src={isMobile ? "/FondoM.png" : "/FondoD.png"}
          alt="Fondo FutStore"
          className="w-full h-full object-fill brightness-[0.6]" 
          // 'object-fill' estira la imagen para cubrir todo sin recortar
          // 'brightness-[0.6]' oscurece un poco para que resalte el texto
        />
      </div>

      {/* (Opcional) Un degradado extra para que el texto se lea mejor si el fondo es muy claro */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-transparent to-black/40" />

      {/* 🔹 CONTENIDO PRINCIPAL */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full pt-16 md:pt-32">
        
        {/* IZQUIERDA: TEXTOS */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left order-2 md:order-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mt-2 mb-16 md:mt-0 md:mb-0 text-5xl md:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">
              BIENVENIDO
            </h1>
            <h2 className="-mt-10 mb-6 md:mt-0 md:mb-0 text-4xl md:text-6xl font-light text-gray-200 mt-2">
              a <span className="font-serif italic text-white">FutStore</span>
            </h2>
            
            <p className="-mt-3 mb-3 md:mt-0 md:mb-0 text-gray-300 text-lg md:text-xl max-w-md mx-auto md:mx-0 font-medium">
              La mejor calidad, la misma pasión.
            </p>
          </motion.div>
        </div>

        {/* DERECHA: CAMISETA + BOTÓN SUPERPUESTO */}
        {/* Margen superior ajustado: mt-36 en móvil, normal en PC */}
        <div className="relative h-[400px] md:h-[600px] flex items-center justify-center order-1 md:order-2 mt-36 md:mt-0">
          
          {/* IMAGEN DEL CARRUSEL (Camisetas) */}
          <AnimatePresence mode="wait">
            <motion.img
              key={slides[index].id}
              src={slides[index].image}
              alt="Camiseta Destacada"
              
              initial={{ opacity: 0, x: 100, rotate: 10, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                rotate: 0, 
                scale: 1,
                transition: { type: "spring", stiffness: 120, damping: 14 }
              }}
              exit={{ 
                opacity: 0, 
                x: -100, 
                rotate: -10, 
                scale: 0.8,
                transition: { duration: 0.3 }
              }}
              
              style={{ filter: "drop-shadow(0px 20px 30px rgba(0,0,0,0.6))" }}
              className="max-h-full max-w-full object-contain cursor-pointer relative z-10"
            />
          </AnimatePresence>

          {/* 🔘 BOTÓN FLOTANTE (SUPERPUESTO) */}
          <div className="absolute bottom-10 right-4 md:right-12 z-20">
            <AnimatePresence mode="wait">
              <motion.button
                key={slides[index].id}
                onClick={handleNavigation}
                initial={{ y: 20, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 10, opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-full font-bold text-lg shadow-2xl ring-2 ring-black backdrop-blur-sm
                           bg-gradient-to-r from-gray-200 via-white to-gray-300 text-black hover:bg-white transition-all"
              >
                {slides[index].title}
              </motion.button>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}