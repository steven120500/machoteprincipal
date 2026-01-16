// src/components/LoginModal.jsx
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiX } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

const GOLD = '#9E8F91';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Estado para saber si estamos en modo Registro o Login
  const [isRegister, setIsRegister] = useState(false); 
  
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef(null);

  // Cerrar con Escape y al click fuera
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.warn('Todos los campos son requeridos');
      return;
    }

    // Decide a qué endpoint llamar según la pestaña activa
    const endpoint = isRegister ? 'register' : 'login';

    try {
      // ⚠️ CORRECCIÓN IMPORTANTE: Quité la doble barra '//' que tenías antes de 'api'
      const res = await fetch(
        `https://machoteprincipal.onrender.com/api/auth/${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await res.json();
      
      // Si falla, lanzamos error
      if (!res.ok) throw new Error(data.message || data.error || 'Error en la solicitud');

      if (isRegister) {
        // Si es registro, avisamos y cambiamos a la pestaña de login
        toast.success('¡Usuario registrado! Ahora inicia sesión.');
        setIsRegister(false); // Cambia automáticamente a la pestaña de login
      } else {
        // Si es login exitoso
        const userData = {
          username: data.username,
          roles: data.roles,
          isSuperUser: data.isSuperUser,
        };

        localStorage.setItem('user', JSON.stringify(userData));
        onLoginSuccess?.(userData);
        onClose?.();
        toast.success(`Bienvenido, ${data.username}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error desconocido');
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
        className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl"
      >
        {/* Botón Cerrar (X) */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-1 rounded-md hover:bg-black/5 text-gray-500"
          aria-label="Cerrar"
          title="Cerrar"
        >
          <FiX size={22} />
        </button>

        {/* Header con tabs (Pestañas) */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center justify-center gap-4 text-sm font-semibold">
            
            {/* Pestaña: Iniciar Sesión */}
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`px-4 py-2 rounded-md transition ${
                !isRegister
                  ? 'text-black shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              style={!isRegister ? { backgroundColor: GOLD } : {}}
            >
              Iniciar Sesión
            </button>
            
            {/* Pestaña: Registrarse (NUEVO) */}
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`px-4 py-2 rounded-md transition ${
                isRegister
                  ? 'text-black shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              style={isRegister ? { backgroundColor: GOLD } : {}}
            >
              Registrarse
            </button>

          </div>
        </div>

        {/* Línea decorativa */}
        <div
          className="h-[2px] w-full opacity-50"
          style={{ backgroundColor: GOLD }}
        />

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Usuario
            </label>
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ focusRingColor: GOLD }}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ focusRingColor: GOLD }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón Principal (Cambia el texto según el modo) */}
          <button
            type="submit"
            className="w-full rounded-lg py-2.5 font-semibold text-black transition hover:opacity-90 shadow-md mt-2"
            style={{ backgroundColor: GOLD }}
          >
            {isRegister ? 'Crear Cuenta' : 'Ingresar'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-gray-300 py-2 font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}