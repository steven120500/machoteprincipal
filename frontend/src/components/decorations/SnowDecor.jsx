import React from "react";

export default function SnowDecor() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-white text-xl animate-fall"
          style={{
            top: `${-Math.random() * 100}px`,
            left: `${Math.random() * 100}%`,
            animationDuration: `${4 + Math.random() * 4}s`,
          }}
        >
          ❄️
        </div>
      ))}
    </div>
  );
}