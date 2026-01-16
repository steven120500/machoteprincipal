import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiX } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

// ✅ URL Blindada (Asegúrate de que tu .env termina en /api)
const API_BASE = import.meta.env.VITE_API_URL || "https://machoteprincipal.onrender.com";

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  
  const [isRegister, setIsRegister] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef(null);

  // 🛡️ Validaciones en tiempo real para la contraseña
  const hasUpper  = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasLength = password.length >= 6;
  const isPasswordValid = hasUpper && hasNumber && hasLength;

  // Limpiar campos al abrir/cerrar o cambiar de modo
  useEffect(() => {
    if (isOpen) {
      setFirstName(''); setLastName(''); setEmail(''); setPassword('');
    }
  }, [isOpen, isRegister]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validación de Correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error('Ingresa un correo electrónico válido');
      return;
    }

    // 2. Validación de Contraseña (Solo en Registro)
    if (isRegister) {
      if (!firstName || !lastName) {
        toast.warn('Nombre y apellido son obligatorios');
        return;
      }
      if (!isPasswordValid) {
        toast.error('La contraseña no cumple con los requisitos mínimos');
        return;
      }
    }

    const endpoint = isRegister ? 'register' : 'login';

    try {
      const payload = isRegister 
        ? { firstName, lastName, email, password } 
        : { email, password };

      // ✅ Usamos /auth/ porque API_BASE ya trae /api
      const res = await fetch(`${API_BASE}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error en la solicitud');

      if (isRegister) {
        toast.success('¡Registro exitoso! Ya puedes iniciar sesión.');
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
        toast.success(`Bienvenido de nuevo, ${data.firstName}`);
      }
    } catch (err) {
      toast.error(err.message || 'Error de conexión');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div 
        ref={cardRef} 
        className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Botón Cerrar (top-2 para mayor espacio) */}
        <button 
          onClick={onClose} 
          className="absolute right-3 top-2 p-1.5 rounded-md fondo-plateado text-black z-10 hover:brightness-90 transition"
        >
          <FiX size={20} />
        </button>

        {/* Título Dinámico */}
        <div className="pt-8 pb-2 text-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          
          {/* Campos de Nombre/Apellido (Solo Registro) */}
          {isRegister && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <input
                type="text" placeholder="Nombre" value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 transition-all"
              />
              <input
                type="text" placeholder="Apellido" value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 transition-all"
              />
            </div>
          )}

          {/* Campo de Correo */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Correo Electrónico</label>
            <input
              type="email" placeholder="tu@correo.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300 transition-all"
            />
          </div>

          {/* Campo de Contraseña */}
          <div>
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="block text-xs font-semibold text-gray-600">Contraseña</label>
              {!isRegister && (
                <button 
                  type="button" 
                  onClick={() => toast.info('Servicio de recuperación en mantenimiento')}
                  className="text-[10px] text-gray-400 hover:text-black hover:underline bg-transparent"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 transition-all ${
                  isRegister && password.length > 0 
                  ? (isPasswordValid ? 'border-green-500 focus:ring-green-100' : 'border-red-300 focus:ring-red-50') 
                  : 'border-gray-300 focus:ring-gray-300'
                }`}
              />
              <button
                type="button" 
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 bg-transparent flex items-center justify-center h-full"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {/* 🚩 Requisitos Dinámicos (Solo en Registro) */}
            {isRegister && (
              <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Tu contraseña debe tener:</p>
                <ul className="space-y-1">
                  <li className={`flex items-center text-[10px] ${hasLength ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span className="mr-1.5">{hasLength ? '✓' : '○'}</span> Al menos 6 caracteres
                  </li>
                  <li className={`flex items-center text-[10px] ${hasUpper ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span className="mr-1.5">{hasUpper ? '✓' : '○'}</span> Una letra MAYÚSCULA
                  </li>
                  <li className={`flex items-center text-[10px] ${hasNumber ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    <span className="mr-1.5">{hasNumber ? '✓' : '○'}</span> Al menos un número
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Botones Finales */}
          <div className="pt-2 space-y-4">
            <button
              type="submit"
              className="w-full rounded-lg py-2.5 font-bold text-black transition hover:scale-[1.02] active:scale-95 shadow-md fondo-plateado"
            >
              {isRegister ? 'Crear Cuenta' : 'Entrar'}
            </button>

            <div className="text-center text-sm text-gray-600">
              {isRegister ? (
                <>¿Ya tienes cuenta? <button type="button" onClick={() => setIsRegister(false)} className="font-bold bg-transparent underline hover:text-black">Inicia sesión</button></>
              ) : (
                <>¿No tienes cuenta? <button type="button" onClick={() => setIsRegister(true)} className="font-bold bg-transparent underline hover:text-black">Regístrate aquí</button></>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}