// src/components/LoginModal.jsx
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiX } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

const GOLD = '#9E8F91';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

    const endpoint = isRegister ? 'register' : 'login';

    try {
      const res = await fetch(
        `https://fut-store.onrender.com/api/auth/${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al autenticar');

      const userData = {
        username: data.username,
        roles: data.roles,
        isSuperUser: data.isSuperUser,
      };

      localStorage.setItem('user', JSON.stringify(userData));
      onLoginSuccess?.(userData);
      onClose?.();
    } catch (err) {
      toast.error(err.message || 'Error desconocido');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onMouseDown={(e) => {
        // cerrar al dar click fuera de la tarjeta
        if (cardRef.current && !cardRef.current.contains(e.target)) onClose?.();
      }}
    >
      <div
        ref={cardRef}
        className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl"
      >
        {/* Cerrar */}
        <button
          onClick={onClose}
          className="absolute right-3 fondo-plateado top-3 p-1 rounded-md hover:bg-black/5"
          aria-label="Cerrar"
          title="Cerrar"
        >
          <FiX size={22} />
        </button>

        {/* Header con tabs */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`px-3 py-1 fondo-plateado  transition ${
                !isRegister
                  ? 'text-black'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              style={!isRegister ? { backgroundColor: GOLD } : {}}
            >
              Iniciar Sesión
            </button>
            
          </div>
        </div>

        {/* Línea dorada */}
        <div
          className="h-[3px] w-full"
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
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-0"
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
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{ focusRingColor: GOLD }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full fondo-plateado rounded-lg py-2 font-semibold text-black transition hover:opacity-90"
           
          >
            {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}