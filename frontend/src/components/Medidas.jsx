// src/components/Medidas.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

// 🔽 importa solo los PNG que usarás
import fanImg from "../assets/Fan.png";
import playerImg from "../assets/Player.png";

export default function Medidas({ open, onClose }) {
  if (!open) return null;

  // Bloquea el scroll del body
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Siempre mostrar Player y Fan
  const CATALOG = [
    { key: "Player", label: "Player", img: playerImg },
    { key: "Fan", label: "Fan", img: fanImg },
  ];

  const modal = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      {/* Caja del modal */}
      <div className="mt-10 mb-16 fixed inset-0 z-50 bg-black/40 flex items-center justify-center py-6">
        <div className="relative bg-white pt-15 p-6 rounded-lg shadow-md max-w-md w-full max-h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-11 right-3 p-2 rounded fondo-plateado text-black hover:bg-gray-800"
            title="Cerrar"
            aria-label="Cerrar"
            
          >
            <FaTimes size={24} />
          </button>

          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b">
            <h3 className="text-lg sm:text-xl font-semibold text-center">
              Guía de Medidas
            </h3>
          </div>

          {/* Body */}
          <div className="p-5 max-h-[85vh] overflow-y-auto">
            {CATALOG.map(({ key, label, img }) => (
              <div key={key} className="mb-8 last:mb-0">
                <h4 className="text-base sm:text-lg font-bold text-center mb-3">
                  {label}
                </h4>
                <div className="w-full flex justify-center">
                  <img
                    src={img}
                    alt={`Guía de medidas ${label}`}
                    className="max-h-[70vh] max-w-full object-contain rounded-md shadow"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}