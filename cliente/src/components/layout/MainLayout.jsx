
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Header from './Header';
import Sidebar from './Sidebar';

const MainLayout = () => {

    const [menuAbierto, setMenuAbierto] = useState(false);

    const location = useLocation();

    // Cerrar menú móvil al cambiar de módulo.
    useEffect(() => {
        setMenuAbierto(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-slate-50">

            <Header
                onMenuClick={() => setMenuAbierto(!menuAbierto)}
            />

            <Sidebar
                abierto={menuAbierto}
                cerrarMenu={() => setMenuAbierto(false)}
            />

            <main className="pt-16 md:pl-64 min-h-screen">

                <div className="pb-8">
                    <Outlet />
                </div>

            </main>

        </div>
    );
};

export default MainLayout;
