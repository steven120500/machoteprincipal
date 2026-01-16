import React from "react";

export default function HalloweenDecor() {
  return (
    <>
      {/* Telarañas */}
      <div className="absolute top-0 left-0 text-4xl">🕸️</div>
      <div className="absolute top-0 right-0 text-4xl">🕸️</div>

      {/* Murciélagos */}
      <div className="absolute top-10 left-10 animate-bounce">🦇</div>
      <div className="absolute top-20 right-20 animate-bounce">🦇</div>
    </>
  );
}