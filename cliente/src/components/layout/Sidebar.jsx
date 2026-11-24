
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import menuItems from '../../config/menuItems';

const Sidebar = ({ abierto, cerrarMenu }) => {

    const location = useLocation();

    const esActivo = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }

        return location.pathname === path ||
            location.pathname.startsWith(`${path}/`);
    };

    return (
        <>
            {/* FONDO PARA MÓVILES */}
            {abierto && (
                <div
                    onClick={cerrarMenu}
                    className="fixed inset-0 top-16 bg-black/50 z-40 md:hidden"
                />
            )}

            {/* MENÚ LATERAL */}
            <aside
                className={`
                    fixed left-0 top-16 bottom-0
                    w-60 bg-slate-900 text-white z-50
                    transition-transform duration-300
                    ${abierto ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0
                `}
            >

                <div className="p-5 border-b border-slate-800">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                        Menú principal
                    </p>

                    <p className="text-sm text-slate-300 mt-2">
                        Administración
                    </p>
                </div>

                <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-100px)]">

                    {menuItems.map((item) => {

                        const Icon = item.icon;
                        const activo = esActivo(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={cerrarMenu}
                                className={`
                                    flex items-center gap-3 px-4 py-3
                                    rounded-lg text-sm font-semibold
                                    transition-all
                                    ${
                                        activo
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }
                                `}
                            >
                                <Icon size={21} />

                                <span>{item.label}</span>

                                {activo && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                            </Link>
                        );
                    })}

                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">
                        Mueblería El Márquez
                    </p>

                    
                </div>

            </aside>
        </>
    );
};

export default Sidebar;
