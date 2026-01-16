import React, { createContext, useContext } from "react";
import halloweenBg from "../assets/halloweenFondo.jpg";
import christmasBg from "../assets/navidadFondo.jpg";
import fotofondo from "../assets/fotofondo.JPG";

// 🎃 Temas por temporada
const THEMES = {
  default: {
    banner: "Bienvenido a FutStore",
    message: "",
    textColor: "text-white ",
    brandColor: "text-gray-400",   // 👈 usa la clase completa
    accent: "bg-gold text-black hover:bg-gray-600",
    backgroundImage: fotofondo,
    decorations: null,
  },
  halloween: {
    banner: "Bienvenido a FutStore",
    // message: "¡Que el terror no sea el precio!  🎃",
    textColor: "text-yellow-500", // Bienvenido a
    brandColor: "text-green-400", // FutStore
    messageColor: "text-yellow-500",
    accent: "bg-yellow-500 text-yellow-500 hover:bg-yellow-600",
    backgroundImage: halloweenBg,
    decorations: null,
  },
  christmas: {
    banner: "Bienvenido a FutStore",
    message: "Especial Navidad: 30% OFF 🎁",
    textColor: "text-red-600",  // Bienvenido a
    brandColor: "text-green-600", // FutStore
    accent: "bg-red-600 text-white hover:bg-red-700",
    backgroundImage: christmasBg,
    decorations: null,
  },
};


// 📌 Contexto
const SeasonContext = createContext(THEMES.default);

export const useSeason = () => useContext(SeasonContext);

// 📌 Proveedor
export const SeasonProvider = ({ season = "default", children }) => {
  const theme = THEMES[season] || THEMES.default;
  return (
    <SeasonContext.Provider value={theme}>
      {children}
    </SeasonContext.Provider>
  );
};
