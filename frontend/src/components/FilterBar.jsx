// src/components/FilterBar.jsx
import React, { useState, useEffect } from "react";

const tipos = [
  "Player",
  "Fan",
  "Mujer",
  "Niño",
  "Retro",
  "Abrigos",
  "Nacional",
  "Balón",       // ✅ NUEVO tipo agregado
  "Ofertas",
  "NBA",
  "MLB",
  "Todos",
];

const tallas = [
  "16", "18", "20", "22", "24", "26", "28",
  "S", "M", "L", "XL", "XXL", "3XL", "4XL"
];

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterSizes,
  setFilterSizes
}) {
  const [showTipos, setShowTipos] = useState(false);
  const [showTallas, setShowTallas] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // 🔹 Detecta si el modo “Ver disponibles” está activo globalmente
  const isDisponibles = window.__verDisponiblesActivo === true;

  // 🔹 Actualiza automáticamente el searchTerm global con pequeño debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 250); // retrasa medio segundo para suavizar escritura
    return () => clearTimeout(timeout);
  }, [localSearch]);

  // 🔹 Texto dinámico del botón de tipo
  const tipoLabel = isDisponibles
    ? "Disponibles"
    : (filterType || "Versión");

  // 🔹 Limpiar filtros (sin romper modo disponibles)
  const handleClear = () => {
    setLocalSearch("");
    setFilterSizes([]);
    // solo borra tipo si no estamos en modo “ver disponibles”
    if (!isDisponibles) {
      setFilterType("");
    }
  };

  // 🔹 Selección de tipo
  const handleTipoClick = (t) => {
    // Si el usuario selecciona cualquier tipo, salimos del modo disponibles
    if (isDisponibles) delete window.__verDisponiblesActivo;

    if (t === "Todos") {
      setFilterType("");
    } else {
      setFilterType(t);
    }

    setShowTipos(false);
  };

  return (
    <div className="w-full px-4 py-3 bg-white relative z-2 shadow flex flex-col gap-3">

      {/* 🔍 Barra de búsqueda */}
      <input
        type="text"
        placeholder="Buscar por equipo o jugador..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-gray-300 outline-none transition"
      />

      {/* 🔽 Ordenar por + botones */}
      <div className="flex flex-wrap items-center justify-center gap-3">

        <span className="font-medium">Ordenar por:</span>

        {/* Botón TIPOS */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTipos(!showTipos);
              setShowTallas(false);
            }}
            className="px-4 py-2 border rounded-md fondo-plateado text-black font-medium"
          >
            {tipoLabel}
          </button>

          {showTipos && (
            <div className="absolute mt-1 w-40 bg-white border rounded-md shadow z-40">
              {tipos.map((t) => (
                <div
                  key={t}
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                  onClick={() => handleTipoClick(t)}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón TALLAS */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTallas(!showTallas);
              setShowTipos(false);
            }}
            className="px-4 py-2 border rounded-md fondo-plateado text-black font-medium"
          >
            {filterSizes.length > 0 ? filterSizes.join(", ") : "Tallas"}
          </button>

          {showTallas && (
            <div className="absolute mt-1 w-40 max-h-60 overflow-y-auto bg-white border rounded-md shadow z-40">
              {tallas.map((t) => (
                <div
                  key={t}
                  className={`px-4 py-2 cursor-pointer ${
                    filterSizes.includes(t)
                      ? "bg-yellow-200 font-semibold"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    if (filterSizes.includes(t)) {
                      setFilterSizes(filterSizes.filter((s) => s !== t));
                    } else {
                      setFilterSizes([...filterSizes, t]);
                    }
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ❌ Limpiar */}
        <button
          onClick={handleClear}
          className="px-4 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700"
          style={{ fontSize: "0.9rem" }}
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
