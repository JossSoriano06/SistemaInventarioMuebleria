
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdMenu, MdLogout } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onMenuClick }) => {

    const navigate = useNavigate();
    const { usuario, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white px-4 flex items-center justify-between z-[60] shadow-lg">

            {/* MARCA */}
            <div className="flex items-center gap-3">

                <button
                    onClick={onMenuClick}
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-800"
                    title="Abrir menú"
                    aria-label="Abrir menú de navegación"
                >
                    <MdMenu size={27} />
                </button>

                <div className="bg-white p-1 rounded-lg w-12 h-12 flex items-center justify-center">
                    <img
                        src="/logoo.png"
                        alt="Logo El Márquez"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div>
                    <h1 className="text-sm font-bold uppercase tracking-tight">
                        Mueblería
                    </h1>

                    <p className="text-[10px] text-red-200 font-bold uppercase tracking-widest">
                        El Márquez
                    </p>
                </div>

            </div>

            {/* INFORMACIÓN DEL USUARIO */}
            <div className="flex items-center gap-3">

                <div className="hidden sm:block text-right">
                    <p className="text-xs font-semibold">
                        {usuario?.nombre_completo || 'Usuario'}
                    </p>

                    <p className="text-[10px] text-slate-400 uppercase">
                        {usuario?.rol || 'ADMIN'}
                    </p>
                </div>

                <div className="w-9 h-9 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-300">
                        {usuario?.nombre_usuario?.substring(0, 2).toUpperCase() || 'US'}
                    </span>
                </div>

                <button
                    onClick={handleLogout}
                    title="Cerrar sesión"
                    aria-label="Cerrar sesión"
                    className="w-9 h-9 rounded-lg bg-red-600 hover:bg-red-700 flex items-center justify-center transition"
                >
                    <MdLogout size={21} />
                </button>

            </div>

        </header>
    );
};

export default Header;
