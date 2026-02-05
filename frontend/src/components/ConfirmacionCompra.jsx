import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ConfirmacionCompra = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Recuperamos datos si los enviaste en el navigate (opcional)
  const { orderId } = location.state || {}; 

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1 style={{ color: 'green' }}>¡Compra Realizada con Éxito!</h1>
      <p>Muchas gracias por tu compra.</p>
      
      {/* Mensaje sobre el correo */}
      <p style={{ marginTop: '20px', fontSize: '18px' }}>
        Hemos enviado un <strong>correo de confirmación</strong> con los detalles de tu pedido.
      </p>

      {orderId && <p>Tu número de orden es: <strong>#{orderId}</strong></p>}

      <button 
        onClick={() => navigate('/')} // Volver al inicio
        style={{ marginTop: '30px', padding: '10px 20px', cursor: 'pointer' }}
      >
        Volver a la Tienda
      </button>
    </div>
  );
};

export default ConfirmacionCompra;