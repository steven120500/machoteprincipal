import React from "react";

export default function ChristmasDecor() {
  return (
    <>
      {/* Luces de Navidad arriba */}
      <div className="absolute top-0 left-0 w-full flex justify-center text-4xl space-x-4">
        <span className="animate-pulse text-red-500">💡</span>
        <span className="animate-pulse text-green-500">💡</span>
        <span className="animate-pulse text-yellow-400">💡</span>
        <span className="animate-pulse text-blue-400">💡</span>
      </div>

      {/* Arbolitos en esquinas */}
      <div className="absolute bottom-0 left-0 text-5xl">🎄</div>
      <div className="absolute bottom-0 right-0 text-5xl">🎄</div>
    </>
  );
}

