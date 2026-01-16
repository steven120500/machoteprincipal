import React, { useEffect, useState } from "react";

function TopBanner() {
  const messages = [
    "STOCK DE +2500 CHEMAS",
    "ENVIOS A TODO EL PAIS",
    "SOMOS FUTSTORE",
    "TU ESTILO JUEGA EN PRIMERA",
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="shadow-md text-center fondo-plateado px-1 sm:px-1 py-1 fixed w-full 
      top-0 left-0 z-50 bg-cover bg-center bg-no-repeat"
    >
      {messages[currentIndex]}
    </div>
  );
}

export default TopBanner;