import { useState } from "react";
import { toast } from "react-toastify";
import { FaTimes, FaEye, FaEyeSlash, FaUser, FaPhone, FaEnvelope, FaLock } from "react-icons/fa";

const API_BASE = "https://machoteprincipal.onrender.com";

export default function RegisterUserModal({ onClose }) {
  // Estados para los nuevos datos
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Roles
  const [roles, setRoles] = useState({
    add: false,
    edit: false,
    delete: false,
    history: false,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.email || !formData.password || !formData.firstName) {
      return toast.warning("Por favor llena los campos obligatorios");
    }

    setLoading(true);

    try {
      const selectedRoles = Object.entries(roles)
        .filter(([, value]) => value)
        .map(([key]) => key);

      // Preparamos el paquete de datos para el backend
      const payload = { 
        username: formData.email, 
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        password: formData.password,
        roles: selectedRoles 
      };

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("✅ Usuario creado exitosamente");
        onClose?.(); 
      } else {
        toast.error(data.message || "Error al registrar");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    // 1. Quitamos pt-28 para centrarlo bien y evitar cortes en pantallas pequeñas
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      
      {/* 2. Agregamos max-h-[90vh] y overflow-y-auto para el SCROLL */}
      <div className="elative bg-white pt-15 p-6 rounded-lg shadow-md max-w-md w-full max-h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition z-10">
          <FaTimes size={20} />
        </button>

        <h2 className="text-2xl font-black uppercase text-center mb-6 tracking-wide sticky top-0 bg-white z-0 pb-2">
          CREAR CUENTA
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Fila 1: Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nombre</label>
               <div className="relative">
                 <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                 <input 
                   name="firstName" 
                   type="text" 
                   placeholder="Nombre" 
                   className="w-full border border-gray-200 bg-gray-50 pl-9 p-3 rounded-xl focus:ring-1 ring-black outline-none transition"
                   onChange={handleChange}
                   required
                 />
               </div>
            </div>
            <div>
               <label className="text-xs font-bold text-gray-400 uppercase ml-1">Apellido</label>
               <input 
                 name="lastName" 
                 type="text" 
                 placeholder="Apellido" 
                 className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl focus:ring-1 ring-black outline-none transition"
                 onChange={handleChange}
               />
            </div>
          </div>

          {/* Fila 2: Celular */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Celular (8 dígitos)</label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input 
                 name="phone" 
                 type="tel" 
                 placeholder="88888888" 
                 maxLength={8}
                 className="w-full border border-gray-200 bg-gray-50 pl-9 p-3 rounded-xl focus:ring-1 ring-black outline-none transition"
                 onChange={handleChange}
              />
            </div>
          </div>

          {/* Fila 3: Correo */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Correo Electrónico</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input 
                 name="email" 
                 type="email" 
                 placeholder="tu@correo.com" 
                 className="w-full border border-gray-200 bg-gray-50 pl-9 p-3 rounded-xl focus:ring-1 ring-black outline-none transition"
                 onChange={handleChange}
                 required
              />
            </div>
          </div>

          {/* Fila 4: Contraseña */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Contraseña</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                className="w-full border border-gray-200 bg-gray-50 pl-9 pr-10 p-3 rounded-xl focus:ring-1 ring-black outline-none transition"
                onChange={handleChange}
                required
              />
              {/* Ajusté la posición del ojo para que quede centrado verticalmente */}
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute bg-transparent right-3 top-0 -translate-y-1/2 text-gray-400 hover:text-black">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {/* Requisitos visuales */}
            <div className="mt-2 ml-1 space-y-1">
               <p className={`text-[10px] flex items-center gap-1 ${formData.password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                 ○ 6+ caracteres
               </p>
               <p className={`text-[10px] flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                 ○ Un número
               </p>
            </div>
          </div>

          {/* Sección de Permisos (Roles) */}
          <div className="pt-2 border-t border-dashed">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Permisos de Administrador:</p>
            <div className="flex flex-wrap gap-3">
              {[
                { key: "add", label: "Agregar" },
                { key: "edit", label: "Editar" },
                { key: "delete", label: "Eliminar" },
                { key: "history", label: "Historial" }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition">
                  <input
                    type="checkbox"
                    checked={roles[key]}
                    onChange={() => setRoles((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className="accent-black w-4 h-4"
                  />
                  <span className="text-xs font-medium text-gray-600">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 fondo-plateado text-black rounded-xl font-bold uppercase tracking-wider hover:bg-gray-800 hover:text-white transition shadow-lg mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? "Creando..." : "Crear Cuenta"}
          </button>

        </form>
      </div>
    </div>
  );
}