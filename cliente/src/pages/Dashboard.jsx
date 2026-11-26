
import React, { useEffect, useState, useCallback } from 'react';
import {
    RefreshCw,
    ShoppingCart,
    Wallet,
    CreditCard,
    TrendingUp,
    Package,
    PackageX,
    AlertTriangle,
    CalendarDays
} from 'lucide-react';

import { obtenerResumenDashboard } from '../services/dashboardService';

import SalesChart from '../components/dashboard/SalesChart';
import SalesComparison from '../components/dashboard/SalesComparison';
import TopBuyers from '../components/dashboard/TopBuyers';
import RecentSales from '../components/dashboard/RecentSales';
import LowStock from '../components/dashboard/LowStock';

import { useNavigate } from 'react-router-dom';


const Dashboard = () => {

    // ==========================================
    // ESTADOS
    // ==========================================

    const [datos, setDatos] = useState(null);

    const [cargando, setCargando] = useState(true);
    
    const [error, setError] = useState('');

    const [periodo, setPeriodo] = useState('dia');

    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');

    const navigate = useNavigate();

    //stock

const irARegistrarStock = (idProducto) => {
    navigate(`/stock?producto=${idProducto}`);
};


    // ==========================================
    // FORMATO DE MONEDA
    // ==========================================

    const formatoMoneda = (valor) => {

        return Number(valor || 0).toLocaleString('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    };


    // ==========================================
    // CARGAR INFORMACIÓN DEL DASHBOARD
    // ==========================================

    const cargarDashboard = useCallback(async () => {
    try {
        setError('');
        setCargando(true);

        const filtros = { periodo };

        if (periodo === 'personalizado') {
            if (!desde || !hasta) {
                setError('Selecciona ambas fechas.');
                return;
            }

            if (desde > hasta) {
                setError('La fecha inicial no puede ser posterior a la final.');
                return;
            }

            filtros.desde = desde;
            filtros.hasta = hasta;
        }

        const respuesta = await obtenerResumenDashboard(filtros);

        setDatos(respuesta);
        

    } catch (error) {
        console.error('Error al cargar dashboard:', error);

        setError(
            error.response?.data?.mensaje ||
            'No se pudo cargar la información del dashboard.'
        );

    } finally {
        setCargando(false);
    }
}, [periodo, desde, hasta]);

    // ==========================================
    // CARGA INICIAL Y CAMBIO DE FILTRO
    // ==========================================

    useEffect(() => {
    if (periodo !== 'personalizado') {
        cargarDashboard();
    }
}, [periodo, cargarDashboard]);


    // ==========================================
    // APLICAR FILTRO PERSONALIZADO
    // ==========================================

    const aplicarFiltroPersonalizado = () => {

        cargarDashboard();

    };


    // ==========================================
    // TARJETA DE INDICADORES
    // ==========================================

    const TarjetaIndicador = ({
        titulo,
        valor,
        descripcion,
        icono: Icono,
        color
    }) => (

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">

            <div className="flex justify-between items-start gap-3">

                <div className="min-w-0">

                    <p className="text-sm font-medium text-slate-500">
                        {titulo}
                    </p>

                    <h3 className="text-2xl font-bold text-slate-900 mt-2 break-words">
                        {valor}
                    </h3>

                    <p className="text-xs text-slate-400 mt-2">
                        {descripcion}
                    </p>

                </div>

                <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${color}`}>
                    <Icono size={23} />
                </div>

            </div>

        </div>

    );


    // ==========================================
    // ESTADO DE CARGA INICIAL
    // ==========================================

    if (cargando && !datos) {

        return (

            <div className="flex flex-col items-center justify-center min-h-[60vh]">

                <RefreshCw
                    className="animate-spin text-indigo-600 mb-4"
                    size={35}
                />

                <p className="text-slate-600 font-semibold">
                    Cargando información del dashboard...
                </p>

            </div>

        );

    }


    // ==========================================
    // ERROR SIN DATOS
    // ==========================================

    if (error && !datos) {

        return (

            <div className="max-w-3xl mx-auto p-6">

                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">

                    <AlertTriangle
                        size={35}
                        className="text-red-500 mx-auto mb-3"
                    />

                    <h2 className="font-bold text-red-700 text-lg">
                        No se pudo cargar el dashboard
                    </h2>

                    <p className="text-sm text-red-600 mt-2">
                        {error}
                    </p>

                    <button
                        onClick={cargarDashboard}
                        className="mt-5 bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700"
                    >
                        Intentar nuevamente
                    </button>

                </div>

            </div>

        );

    }


    // ==========================================
    // INDICADORES
    // ==========================================

    const indicadores = datos?.indicadores || {};


    // ==========================================
    // INTERFAZ PRINCIPAL
    // ==========================================

    return (

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">


            

            {/* ==================================
                FILTROS
            ================================== */}

            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                    <div className="flex items-center gap-2">

                        <CalendarDays
                            size={20}
                            className="text-indigo-600"
                        />

                        <h2 className="font-bold text-slate-800">
                            Filtrar información
                        </h2>

                    </div>


                    <div className="flex flex-wrap gap-2">

                        {[
                            { valor: 'dia', texto: 'Hoy' },
                            { valor: 'semana', texto: 'Últimos 7 días' },
                            { valor: 'mes', texto: 'Este mes' },
                            { valor: 'personalizado', texto: 'Personalizado' }
                        ].map((filtro) => (

                            <button
                                key={filtro.valor}
                                onClick={() => setPeriodo(filtro.valor)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                    periodo === filtro.valor
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >

                                {filtro.texto}

                            </button>

                        ))}

                    </div>

                </div>


                {/* FECHAS PERSONALIZADAS */}

                {periodo === 'personalizado' && (

                    <div className="border-t border-slate-100 mt-5 pt-5">

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">

                            <div>

                                <label className="block text-xs font-semibold text-slate-600 mb-2">
                                    Fecha inicial
                                </label>

                                <input
                                    type="date"
                                    value={desde}
                                    onChange={(e) => setDesde(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                            </div>


                            <div>

                                <label className="block text-xs font-semibold text-slate-600 mb-2">
                                    Fecha final
                                </label>

                                <input
                                    type="date"
                                    value={hasta}
                                    onChange={(e) => setHasta(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                            </div>


                            <button
                                onClick={aplicarFiltroPersonalizado}
                                disabled={
                                    !desde ||
                                    !hasta ||
                                    desde > hasta ||
                                    cargando
                                }
                                className="bg-indigo-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >

                                Aplicar fechas

                            </button>

                        </div>

                    </div>

                )}


                

            </div>

            


            {/* ==================================
                INDICADORES COMERCIALES
            ================================== */}

            <div className="mb-3">

                <h2 className="text-lg font-bold text-slate-800">
                    Resumen comercial
                </h2>

                <p className="text-sm text-slate-500">
                    Resultados del período seleccionado
                </p>

            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">

                <TarjetaIndicador
                    titulo="Ventas realizadas"
                    valor={indicadores.cantidad_ventas || 0}
                    descripcion="Operaciones registradas"
                    icono={ShoppingCart}
                    color="bg-blue-100 text-blue-600"
                />

                <TarjetaIndicador
                    titulo="Total vendido"
                    valor={formatoMoneda(indicadores.total_vendido)}
                    descripcion="Importe total de las ventas"
                    icono={TrendingUp}
                    color="bg-indigo-100 text-indigo-600"
                />

                <TarjetaIndicador
                    titulo="Total cobrado"
                    valor={formatoMoneda(indicadores.total_cobrado)}
                    descripcion="Dinero recibido"
                    icono={Wallet}
                    color="bg-emerald-100 text-emerald-600"
                />

                <TarjetaIndicador
                    titulo="Pendiente de cobro"
                    valor={formatoMoneda(indicadores.pendiente_cobro)}
                    descripcion="Saldo pendiente de pago"
                    icono={CreditCard}
                    color="bg-amber-100 text-amber-600"
                />

            </div>


            {/* ==================================
                INDICADORES DE INVENTARIO
            ================================== */}

            <div className="mb-3">

                <h2 className="text-lg font-bold text-slate-800">
                    Estado del inventario
                </h2>

                <p className="text-sm text-slate-500">
                    Situación actual de los productos
                </p>

            </div>


            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">

                <TarjetaIndicador
                    titulo="Productos registrados"
                    valor={indicadores.total_productos || 0}
                    descripcion="Productos en el sistema"
                    icono={Package}
                    color="bg-sky-100 text-sky-600"
                />

                <TarjetaIndicador
                    titulo="Productos agotados"
                    valor={indicadores.productos_agotados || 0}
                    descripcion="Sin existencias disponibles"
                    icono={PackageX}
                    color="bg-red-100 text-red-600"
                />

                <TarjetaIndicador
                    titulo="Stock bajo"
                    valor={indicadores.productos_stock_bajo || 0}
                    descripcion="Requieren reposición"
                    icono={AlertTriangle}
                    color="bg-orange-100 text-orange-600"
                />

            </div>

            {/* ==================================
                ALERTAS DE INVENTARIO
            ================================== */}

            <div className="mb-7">

                <LowStock
                        datos={datos?.stock_bajo || []}
                        onSeleccionarProducto={irARegistrarStock}
                    />

            </div>


            {/* ==================================
                GRÁFICOS
            ================================== */}

            <div className="mb-3">

                <h2 className="text-lg font-bold text-slate-800">
                    Análisis de ventas
                </h2>

                <p className="text-sm text-slate-500">
                    Comportamiento comercial por período
                </p>

            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">

                <SalesChart
                    datos={datos?.evolucion || []}
                />

                <SalesComparison
                    datos={datos?.ventas_por_tipo || {}}
                />

            </div>


            {/* ==================================
                COMPRADORES FRECUENTES
            ================================== */}

            <div className="mb-7">

                <TopBuyers
                    datos={datos?.compradores_frecuentes || []}
                />

            </div>


            {/* ==================================
                ÚLTIMAS VENTAS
            ================================== */}

            <div className="mb-7">

                <RecentSales
                    datos={datos?.ultimas_ventas || []}
                />

            </div>


            


            

        </div>

    );

};

export default Dashboard;
