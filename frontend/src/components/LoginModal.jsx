// src/components/LoginModal.jsx
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiX } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

// ✅ URL Blindada
const API_BASE = import.meta.env.VITE_API_URL || "https://machoteprincipal.onrender.com";

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  
  const [isRegister, setIsRegister] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setIsRegister(false); // Siempre abrir en Login por defecto
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warn('Correo y contraseña son obligatorios');
      return;
    }
    if (isRegister && (!firstName || !lastName)) {
      toast.warn('Nombre y apellido son obligatorios para registrarse');
      return;
    }

    const endpoint = isRegister ? 'register' : 'login';

    try {
      const payload = isRegister 
        ? { firstName, lastName, email, password } 
        : { email, password };

      const res = await fetch(`${API_BASE}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Error en la solicitud');

      if (isRegister) {
        toast.success('¡Registro exitoso! Por favor inicia sesión.');
        setIsRegister(false);
      } else {
        const userData = {
          id: data.id,
          username: data.firstName, 
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          roles: data.roles,
          isSuperUser: data.isSuperUser,
        };

        localStorage.setItem('user', JSON.stringify(userData));
        onLoginSuccess?.(userData);
        onClose?.();
        toast.success(`Hola de nuevo, ${data.firstName}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error de conexión');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onMouseDown={(e) => {
        if (cardRef.current && !cardRef.current.contains(e.target)) onClose?.();
      }}
    >
      <div
        ref={cardRef}
        className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl overflow-hidden"
      >
        {/* Botón Cerrar (Subido un poco con top-2) */}
        <button
          onClick={onClose}
          className="absolute right-3 top-2 p-1 rounded-md fondo-plateado text-black z-10 transition"
        >
          <FiX size={24} />
        </button>

        {/* Título (Ya no es botón, es texto centrado) */}
        <div className="pt-8 pb-2 text-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          
          {isRegister && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  placeholder="Ej. Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-400 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  placeholder="Ej. Pérez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-400 outline-none text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:ring-2 focus:ring-gray-400 outline-none"
              />
              {/* 👁️ Icono de Ojo alineado perfectamente (top-1/2) */}
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-0 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent flex items-center justify-center"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-2 space-y-4">
            <button
              type="submit"
              className="w-full rounded-lg py-2.5 font-bold text-black transition hover:brightness-110 shadow-md fondo-plateado"
            >
              {isRegister ? 'Registrarse' : 'Entrar'}
            </button>

            {/* 👇 Texto inferior para cambiar entre Login/Registro */}
            <div className="text-center text-sm text-gray-600 pb-2">
              {isRegister ? (
                <>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="font-bold bg-transparent underline hover:text-black transition"
                  >
                    Inicia sesión aquí
                  </button>
                </>
              ) : (
                <>
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="font-bold bg-transparent underline hover:text-black transition"
                  >
                    Regístrate aquí
                  </button>
                </>
              )}
            </div>
            
          </div>
        </form>
      </div>
    </div>
  );
}