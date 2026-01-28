import logo from "../assets/logo.png";
import { FaBars, FaTimes, FaShoppingCart, FaUser } from "react-icons/fa"; // 👈 Agregamos FaUser
import { LiaRulerSolid } from "react-icons/lia";
import { FiPhoneCall } from "react-icons/fi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Contacto from "./Contacto"; 
import { useCart } from "../context/CartContext";

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
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContacto, setShowContacto] = useState(false);
  
  const navigate = useNavigate();
  const { cartCount } = useCart();

  const handleCartClick = () => {
    if (cartCount > 0) {
      navigate('/checkout');
    } else {
      toast.info("Tu carrito está vacío 🛒");
    }
  };

  // 👇 Función para sacar las iniciales (Ej: "Steven Corrales" -> "SC")
  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <header
      className="shadow-md fondo-plateado px-1 sm:px-10 sm:py-4 py-1 fixed w-full 
                 top-8 left-0 z-50 bg-cover bg-center bg-no-repeat"
      style={{ backgroundColor: "#000" }}
    >
      <div className="flex items-center justify-between">
        {/* 🔹 IZQUIERDA */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onLogoClick}
            title="Volver al inicio"
            className="focus:outline-none"
            style={{ backgroundColor: "transparent" }}
          >
            <img src={logo} alt="Logo" className="h-16 sm:h-28" />
          </button>

          <button onClick={onMedidasClick} className="text-white text-xs sm:text-lg bg-black font-semibold px-2 sm:px-4 py-1 rounded flex items-center gap-1">
            <LiaRulerSolid size={20} /> <span className="hidden sm:inline">Tallas</span>
          </button>

          <button onClick={() => setShowContacto(true)} className="text-white bg-black text-xs sm:text-lg font-semibold px-2 sm:px-4 py-1 rounded flex items-center gap-1">
            <FiPhoneCall size={20} /> <span className="hidden sm:inline">Contacto</span>
          </button>
        </div>

        {/* 🔹 DERECHA: CARRITO Y MENÚ DE USUARIO */}
        <div className="flex items-center gap-3">
          
          {/* 🛒 BOTÓN CARRITO */}
          <button 
            onClick={handleCartClick} 
            className="relative bg-black text-white p-2 rounded-full shadow-lg hover:bg-gray-800 transition"
          >
            <FaShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-black animate-bounce">
                {cartCount}
              </span>
            )}
          </button>

          {/* 👤 BOTÓN PERFIL / MENÚ (Modificado) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-full bg-black p-2 w-10 h-10 flex items-center justify-center shadow-md hover:bg-gray-800 text-white transition-all border border-gray-700"
            title={user ? user.username : "Menú"}
          >
            {user ? (
              // Si hay usuario: Mostramos iniciales
              <span className="font-bold text-sm tracking-tighter">
                {getInitials(user.username || user.name || "US")}
              </span>
            ) : (
              // Si NO hay usuario: Mostramos icono de persona
              <FaUser size={18} />
            )}
          </button>
        </div>
      </div>

      {/* 🔸 SIDEBAR (Menú lateral) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40" onClick={() => setSidebarOpen(false)}>
          <div className="fixed top-0 right-0 h-full w-72 sm:w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative fondo-plateado h-full overflow-y-auto pt-14 p-5" style={{ backgroundColor: "#000" }}>
              <button onClick={() => setSidebarOpen(false)} className="absolute text-white top-3 right-3 rounded-full w-9 h-9 grid place-items-center hover:bg-gray-900">
                <FaTimes size={20} />
              </button>

              {user ? (
                <>
                  <div className="mb-6 border-b border-gray-800 pb-4">
                    <p className="text-gray-400 text-sm">Hola,</p>
                    <p className="text-blacks font-bold text-xl">{user.username}</p>
                  </div>

                  {isSuperUser && <button onClick={() => { setShowRegisterUserModal(true); setSidebarOpen(false); }} className="w-full fondo-plateado text-left mb-3 px-4 py-2 rounded-lg">Agregar usuario</button>}
                  {isSuperUser && <button onClick={() => { setShowUserListModal(true); setSidebarOpen(false); }} className="w-full fondo-plateado text-left mb-3 px-4 py-2 rounded-lg">Ver usuarios</button>}
                  {canSeeHistory && <button onClick={() => { setShowHistoryModal(true); setSidebarOpen(false); }} className="w-full fondo-plateado text-left mb-3 px-4 py-2 rounded-lg">Historial</button>}
                  
                  <button onClick={() => { onLogout(); setSidebarOpen(false); }} className="w-full text-left mt-4 px-4 py-3 rounded-lg font-bold text-red-500 hover:bg-red-900/20 border border-red-900/50 transition">
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <div className="text-center mt-10">
                  <FaUser size={50} className="text-gray-500 mx-auto mb-4"/>
                  <p className="text-gray-400 mb-6">Inicia sesión para recibir imformación.</p>
                  <button onClick={() => { onLoginClick(); setSidebarOpen(false); }} className="w-full bg-white text-black px-4 py-3 rounded-lg font-bold hover:bg-gray-200 transition">
                    Iniciar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔹 MODAL CONTACTO */}
      {showContacto && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg relative w-80 sm:w-96">
            <button onClick={() => setShowContacto(false)} className="absolute top-2 right-2 text-black font-bold hover:text-red-500"><FaTimes size={20} /></button>
            <h2 className="text-l font-bold mb-4 text-center">Contáctanos</h2>
            <Contacto />
          </div>
        </div>
      )}
    </header>
  );
}