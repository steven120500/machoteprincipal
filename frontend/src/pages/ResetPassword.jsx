import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_URL || "https://machoteprincipal.onrender.com";

export default function ResetPassword() {
  const { token } = useParams(); // Captura el token de la URL
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validaciones en tiempo real
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasLength = password.length >= 6;
  const isPasswordValid = hasUpper && hasNumber && hasLength;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error('La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al restablecer');

      toast.success('¡Contraseña actualizada con éxito!');
      setTimeout(() => navigate('/'), 2000); // Regresa al inicio tras 2 segundos
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <FiLock className="h-6 w-6 text-gray-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 uppercase tracking-tight">Nueva Contraseña</h2>
          <p className="mt-2 text-sm text-gray-500">Crea una clave que no hayas usado antes.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Input Nueva Clave */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva Contraseña"
                className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${
                  password.length > 0 ? (isPasswordValid ? 'border-green-500 ring-2 ring-green-50' : 'border-red-300 ring-2 ring-red-50') : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>

            {/* Input Confirmar Clave */}
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar Contraseña"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* Guía de requisitos */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Requisitos de seguridad:</p>
            <ul className="space-y-1">
              <li className={`flex items-center text-xs ${hasLength ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                <span className="mr-2">{hasLength ? '✓' : '○'}</span> 6+ caracteres
              </li>
              <li className={`flex items-center text-xs ${hasUpper ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                <span className="mr-2">{hasUpper ? '✓' : '○'}</span> Al menos una MAYÚSCULA
              </li>
              <li className={`flex items-center text-xs ${hasNumber ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                <span className="mr-2">{hasNumber ? '✓' : '○'}</span> Al menos un número
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className={`w-full py-3 rounded-lg font-bold text-black shadow-lg transition-all hover:scale-[1.02] active:scale-95 ${
              loading || !isPasswordValid ? 'bg-gray-200 cursor-not-allowed opacity-50' : 'fondo-plateado'
            }`}
          >
            {loading ? 'ACTUALIZANDO...' : 'RESTABLECER CONTRASEÑA'}
          </button>
        </form>
      </div>
    </div>
  );
}