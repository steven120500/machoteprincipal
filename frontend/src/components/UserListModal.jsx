import React, { useEffect, useState } from "react";
import { toast as toastHOT } from "react-hot-toast";

const API_BASE = "https://machoteprincipal.onrender.com";

export default function UserListModal({ open, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Obtenemos usuario actual de localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!open) return;
    fetchUsers();
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = currentUser.token; 
      const res = await fetch(`${API_BASE}/api/auth/users`, { 
        headers: { 
            Accept: "application/json",
            Authorization: `Bearer ${token}` 
        } 
      });
      
      if (!res.ok) throw new Error("Error al obtener usuarios");
      
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toastHOT.error("No se pudo cargar la lista");
    } finally {
      setLoading(false);
    }
  };

  function askDeleteUser(userToDelete) {
    // Validaciones de seguridad
    if (currentUser.email === userToDelete.email) {
      toastHOT.error("No puedes eliminar tu propia cuenta.");
      return;
    }
    if (userToDelete.isSuperUser) {
      toastHOT.error("No se puede eliminar al Superadmin.");
      return;
    }

    const nameToShow = getDisplayName(userToDelete);

    toastHOT((t) => (
      <div className="flex flex-col gap-2">
        <p className="text-sm">¿Eliminar a <b>{nameToShow}</b>?</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toastHOT.dismiss(t.id)}
            className="bg-gray-200 px-3 py-1 rounded text-xs font-bold hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={() => { toastHOT.dismiss(t.id); doDeleteUser(userToDelete._id); }}
            className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  }

  async function doDeleteUser(userId) {
    if (!userId) return toastHOT.error("Error: ID inválido");

    try {
      const freshUser = JSON.parse(localStorage.getItem("user") || "{}");
      const token = freshUser.token;

      if (!token) {
        toastHOT.error("Sesión expirada.");
        return;
      }

      const res = await fetch(`${API_BASE}/api/auth/users/${userId}`, {
        method: "DELETE",
        headers: { 
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
        },
      });

      if (!res.ok) {
        throw new Error("Fallo al eliminar");
      }

      // Actualizar la lista visualmente quitando al usuario borrado
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toastHOT.success("Usuario eliminado correctamente");
    } catch (e) {
      console.error(e);
      toastHOT.error("Error al eliminar usuario");
    }
  }

  // Función para obtener el nombre a mostrar
  const getDisplayName = (u) => {
    if (u.firstName || u.lastName) {
      return `${u.firstName || ""} ${u.lastName || ""}`.trim();
    }
    return u.username || u.email || "Usuario";
  };

  // Función para traducir y mostrar roles bonitos
  const getRoleDisplay = (u) => {
    if (u.isSuperUser) return "Superadmin";
    
    if (u.roles && u.roles.length > 0) {
      // Diccionario para traducir roles de inglés a español
      const mapRoles = {
        add: "Agregar",
        edit: "Editar",
        delete: "Eliminar",
        history: "Historial"
      };
      // Traducimos y unimos con comas
      return u.roles.map(r => mapRoles[r] || r).join(", ");
    }
    
    return "Cliente";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in relative">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Gestión de Usuarios</h2>
          <button 
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-1 rounded text-sm hover:bg-gray-600 transition"
          >
            Cerrar
          </button>
        </div>

        {/* Lista de Usuarios */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <p className="text-center text-gray-400 py-4">Cargando...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No hay usuarios.</p>
          ) : (
            users.map((u) => {
              const displayName = getDisplayName(u);
              const roleText = getRoleDisplay(u); // Aquí calculamos el texto correcto
              
              const isMe = (currentUser.email === u.email);
              const isSuper = u.isSuperUser;
              
              // Puede borrar si: No es él mismo Y el objetivo no es Superadmin
              const canDelete = !isMe && !isSuper; 

              return (
                <div key={u._id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0 hover:bg-gray-50 p-2 rounded transition">
                  {/* Izquierda: Nombre y Rol Real */}
                  <div>
                    <h3 className="font-bold text-lg text-black capitalize flex items-center gap-2">
                      {displayName}
                      {isMe && <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded">TÚ</span>}
                    </h3>
                    
                    {/* Aquí mostramos los roles reales */}
                    <p className={`text-xs ${isSuper ? 'text-black font-bold' : 'text-gray-500'}`}>
                      {roleText}
                    </p>
                  </div>

                  {/* Derecha: Botón Eliminar */}
                  <div>
                    {canDelete ? (
                      <button 
                        onClick={() => askDeleteUser(u)}
                        className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-100 hover:text-red-600 transition border border-gray-200"
                      >
                        Eliminar
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-300 italic px-2 cursor-default select-none">
                        {isMe ? "Activo" : "Protegido"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}