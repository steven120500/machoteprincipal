import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="pt-10 mt-10 text-center py-8 border-t border-gray-200 relative z-10">
      
     
        

       {/* Texto inferior */}
       <div className="mt-4 text-sm text-gray-800 space-y-1">
        <p>© 2025 FutStore. Todos los derechos reservados.</p>
        <p>
          Diseñado por{" "}
          <a
            href="https://wa.me/50688028216"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-800 font-bold underline hover:text-gray-800 font-medium"
          >
            Steven Corrales Alfaro
          </a>
        </p>
      </div>
    </footer>
  );
}