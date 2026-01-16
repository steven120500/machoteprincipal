import { useState, useEffect } from "react";

export default function CarruselFondo({ imagenes = [], intervalo = 7000 }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!imagenes.length) return;
    const cambio = setInterval(() => {
      setIndex((prev) => (prev + 1) % imagenes.length);
    }, intervalo);
    return () => clearInterval(cambio);
  }, [imagenes, intervalo]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 🔹 Imágenes de fondo con difuminado + leve zoom */}
      {imagenes.map((img, i) => (
        <div
          key={i}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${
            i === index ? "opacity-100 scale-105 z-10" : "opacity-0 scale-100 z-0"
          }`}
          style={{
            backgroundImage: `url(${img})`,
            transition: "opacity 2s ease-in-out, transform 8s ease-in-out",
          }}
        />
      ))}

      {/* 🔸 Sombra oscura para legibilidad del texto */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* ⚪ Indicadores (bolitas) */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
        {imagenes.map((_, i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              i === index
                ? "bg-white scale-125 shadow-lg"
                : "bg-gray-400 opacity-70 hover:opacity-100"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
