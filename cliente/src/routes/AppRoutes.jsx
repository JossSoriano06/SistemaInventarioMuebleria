
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ProductoPage from '../pages/Producto';
import ClientePage from '../pages/ClientePage';
import StockPage from '../pages/StockPage';
import VentaMenor from '../pages/VentaMenor';
import VentasPage from '../pages/VentasPage';
import HistorialMenor from '../pages/HistorialMenor';

import ProtectedRoute from '../components/ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';

const AppRoutes = () => {

    return (
        <Routes>

            {/* ACCESO PÚBLICO */}
            <Route
                path="/login"
                element={<Login />}
            />

            {/* MÓDULOS PROTEGIDOS */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >

                <Route
                    index
                    element={<Dashboard />}
                />

                <Route
                    path="productos"
                    element={<ProductoPage />}
                />

                <Route
                    path="stock"
                    element={<StockPage />}
                />

                <Route
                    path="clientes"
                    element={<ClientePage />}
                />

                <Route
                    path="ventas"
                    element={<VentasPage />}
                />

                <Route
                    path="venta-menor"
                    element={<VentaMenor />}
                />

                <Route
                    path="historial-venta-menor"
                    element={<HistorialMenor />}
                />

                {/* PÁGINA NO ENCONTRADA */}
                <Route
                    path="*"
                    element={
                        <div className="text-center mt-20 px-6">

                            <h2 className="text-2xl font-bold text-slate-900">
                                Página no encontrada
                            </h2>

                            <p className="text-slate-500 mt-2">
                                No encontramos el módulo solicitado.
                            </p>

                            <Link
                                to="/"
                                className="text-indigo-600 font-bold mt-4 inline-block"
                            >
                                Volver al Dashboard
                            </Link>

                        </div>
                    }
                />

            </Route>

        </Routes>
    );
};

export default AppRoutes;
