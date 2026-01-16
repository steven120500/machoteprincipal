import logo from "../assets/logo.png";
import FondoHeader from "../assets/FondoHeader.png"; // ✅ imagen de fondo
import { FaBars, FaTimes } from "react-icons/fa";
import { LiaRulerSolid } from "react-icons/lia";
import { FiPhoneCall } from "react-icons/fi";
import { useState } from "react";
import Contacto from "./Contacto"; // 🔹 componente contacto

export default function Header({
  onLoginClick,
  onLogout,
  onLogoClick,
  user,
  canSeeHistory,
  isSuperUser,
  setShowRegisterUserModal,
  setShowUserListModal,
  setShowHistoryModal,
  onMedidasClick,
  setFilterType,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContacto, setShowContacto] = useState(false);

  return (
    <header
      className="shadow-md fondo-plateado px-1 sm:px-10 sm:py-4 py-1 fixed w-full 
                 top-8 left-0 z-50 bg-cover bg-center bg-no-repeat"
      style={{
        // backgroundImage: `url(${FondoHeader})`, // ✅ fondo con imagen opcional
        backgroundColor: "#000", // 🖤 fondo negro sólido
      }}
    >
      <div className="flex items-center justify-between">
        {/* 🔹 IZQUIERDA */}
        <div className="flex items-center gap sm:gap-4">
          {/* LOGO */}
          <button
            onClick={onLogoClick}
            title="Volver al inicio"
            className="focus:outline-none"
            style={{
              backgroundColor: "transparent",
              color: "#fff",
              fontSize: "1rem",
            }}
          >
            <img src={logo} alt="Logo" className="h-16 sm:h-28" />
          </button>

          {/* MEDIDAS */}
          <button
            onClick={onMedidasClick}
            className="text-white text-xs sm:text-lg bg-black mr-2 font-semibold px-2 sm:px-4 py-1 rounded flex items-center gap-1"
          >
            <LiaRulerSolid size={24} />
            <span>Tallas</span>
          </button>

          {/* CONTACTO */}
          <button
            onClick={() => setShowContacto(true)}
            className="text-white bg-black text-xs sm:text-lg font-semibold px-2 sm:px-4 py-1 rounded flex items-center gap-1"
          >
            <FiPhoneCall size={24} />
            <span>Contacto</span>
          </button>
        </div>

        {/* 🔹 BOTÓN MENÚ */}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-full bg-black p-2 sm:text-lg shadow-md hover:bg-gray-800 text-white"
          >
            <FaBars size={18} />
          </button>
        </div>
      </div>

      {/* 🔸 SIDEBAR */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/40"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed top-0 right-0 h-full w-72 sm:w-80 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative fondo-plateado h-full overflow-y-auto pt-14 p-5"
              style={{
                backgroundColor: "#000", // 🖤 sidebar negro
                // backgroundImage: `url(${FondoHeader})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Cerrar menú"
                className="absolute text-white text-center top-3 right-2 sm:right-3 grid place-items-center rounded-full w-9 h-9"
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                }}
              >
                <FaTimes size={20} />
              </button>

              {/* 🔹 Opciones del Sidebar */}
              {user ? (
                <>
                  {isSuperUser && (
                    <button
                      onClick={() => {
                        setShowRegisterUserModal(true);
                        setSidebarOpen(false);
                      }}
                      className="w-full fondo-plateado text-left mb-3 px-4 py-2 rounded-lg"
                    >
                      Agregar usuario
                    </button>
                  )}

                  {isSuperUser && (
                    <button
                      onClick={() => {
                        setShowUserListModal(true);
                        setSidebarOpen(false);
                      }}
                      className="w-full fondo-plateado text-left mb-3 px-4 py-2 rounded-lg"
                    >
                      Ver usuarios
                    </button>
                  )}

                  {canSeeHistory && (
                    <button
                      onClick={() => {
                        setShowHistoryModal(true);
                        setSidebarOpen(false);
                      }}
                      className="w-full fondo-plateado text-left mb-3 px-4 py-2 rounded-lg"
                    >
                      Historial
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onLogout();
                      setSidebarOpen(false);
                    }}
                    className="w-full fondo-plateado text-left mt-2 px-4 py-2 rounded-lg font-semibold text-red-700"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onLoginClick();
                    setSidebarOpen(false);
                  }}
                  className="w-full fondo-plateado text-left px-4 py-2 rounded-lg font-semibold"
                >
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔹 MODAL CONTACTO */}
      {showContacto && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg relative w-80 sm:w-96">
            <button
              onClick={() => setShowContacto(false)}
              className="absolute top-2 fondo-plateado right-2 text-black font-bold"
            >
              <FaTimes size={20} />
            </button>
            <h2 className="text-l font-bold mb-4 text-center">Contáctanos</h2>
            <Contacto />
          </div>
        </div>
      )}
    </header>
  );
}
