
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import {
    MdInventory,
    MdSearch,
    MdAdd,
    MdRemove,
    MdHistory,
    MdWarning,
    MdCheckCircle,
    MdError,
    MdClose,
    MdWarehouse,
    MdFilterList,
    MdTune
} from 'react-icons/md';

const API_URL = 'http://localhost:3004/api/stock';
const PRODUCTOS_API_URL = 'http://localhost:3004/api/productos';

function StockPage() {

    const [productos, setProductos] = useState([]);
    const [movimientos, setMovimientos] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingMovimientos, setLoadingMovimientos] = useState(false);

    const [vista, setVista] = useState('inventario');

    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState('TODOS');

    const [mostrarModal, setMostrarModal] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState('INICIAL');

    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [productoHistorial, setProductoHistorial] = useState(null);

    const [formulario, setFormulario] = useState({
        id_producto: '',
        cantidad: '',
        motivo: ''
    });

    const [guardando, setGuardando] = useState(false);

    const [mensaje, setMensaje] = useState({
        tipo: '',
        texto: ''
    });


    // =====================================================
    // CARGAR INVENTARIO
    // =====================================================

    const cargarProductos = async () => {

        try {

            setLoading(true);

            const response = await axios.get(API_URL);

            setProductos(response.data);

        } catch (error) {

            console.error('Error al cargar inventario:', error);

            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.mensaje ||
                    'No se pudo cargar el inventario.'
            });

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // CARGAR HISTORIAL GENERAL O INDIVIDUAL
    // =====================================================

    const cargarMovimientos = async (idProducto = null) => {

        try {

            setLoadingMovimientos(true);

            const url = idProducto
                ? `${API_URL}/${idProducto}/movimientos`
                : `${API_URL}/movimientos`;

            const response = await axios.get(url);

            setMovimientos(response.data);

        } catch (error) {

            console.error('Error al cargar movimientos:', error);

            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.mensaje ||
                    'No se pudo cargar el historial.'
            });

        } finally {

            setLoadingMovimientos(false);

        }

    };


    // =====================================================
    // EFECTOS
    // =====================================================

    useEffect(() => {
        cargarProductos();
    }, []);

    useEffect(() => {

        if (vista === 'historial') {

            cargarMovimientos(
                productoHistorial?.id || null
            );

        }

    }, [vista, productoHistorial]);


    // =====================================================
    // ESTADÍSTICAS
    // =====================================================

    const estadisticas = useMemo(() => {

        const totalProductos = productos.length;

        const totalUnidades = productos.reduce(
            (total, producto) =>
                total + Number(producto.stock || 0),
            0
        );

        const stockBajo = productos.filter(
            producto =>
                Number(producto.stock) > 0 &&
                Number(producto.stock) <= Number(producto.stock_minimo)
        ).length;

        const agotados = productos.filter(
            producto => Number(producto.stock) === 0
        ).length;

        return {
            totalProductos,
            totalUnidades,
            stockBajo,
            agotados
        };

    }, [productos]);


    // =====================================================
    // FILTRAR PRODUCTOS
    // =====================================================

    const productosFiltrados = useMemo(() => {

        return productos.filter(producto => {

            const nombre = String(producto.nombre || '');

            const coincideBusqueda = nombre
                .toLowerCase()
                .includes(busqueda.toLowerCase());

            const stock = Number(producto.stock || 0);
            const minimo = Number(producto.stock_minimo || 0);

            let coincideFiltro = true;

            if (filtro === 'DISPONIBLE') {
                coincideFiltro = stock > minimo;
            }

            if (filtro === 'BAJO') {
                coincideFiltro = stock > 0 && stock <= minimo;
            }

            if (filtro === 'AGOTADO') {
                coincideFiltro = stock === 0;
            }

            return coincideBusqueda && coincideFiltro;

        });

    }, [productos, busqueda, filtro]);


    // =====================================================
    // ABRIR MODAL
    // =====================================================

    const abrirModal = (tipo, producto) => {

        setTipoMovimiento(tipo);

        setProductoSeleccionado(producto);

        setFormulario({
            id_producto: String(producto.id),

            cantidad: tipo === 'MINIMO'
                ? String(producto.stock_minimo ?? 0)
                : '',

            motivo: ''
        });

        setMensaje({
            tipo: '',
            texto: ''
        });

        setMostrarModal(true);

    };


    // =====================================================
    // CERRAR MODAL
    // =====================================================

    const cerrarModal = () => {

        if (guardando) return;

        setMostrarModal(false);

        setProductoSeleccionado(null);

        setFormulario({
            id_producto: '',
            cantidad: '',
            motivo: ''
        });

        setMensaje({
            tipo: '',
            texto: ''
        });

    };


    // =====================================================
    // MANEJAR FORMULARIO
    // =====================================================

    const manejarCambio = (e) => {

        const { name, value } = e.target;

        setFormulario(prev => ({
            ...prev,
            [name]: value
        }));

    };


    // =====================================================
    // ACTUALIZAR STOCK MÍNIMO
    // =====================================================

    const actualizarStockMinimo = async () => {

        const stockMinimo = Number(formulario.cantidad);

        if (
            formulario.cantidad === '' ||
            !Number.isInteger(stockMinimo) ||
            stockMinimo < 0
        ) {

            setMensaje({
                tipo: 'error',
                texto: 'El stock mínimo debe ser un número entero igual o mayor a cero.'
            });

            return false;

        }

        try {

            setGuardando(true);

            const response = await axios.put(
                `${PRODUCTOS_API_URL}/${formulario.id_producto}`,
                {
                    stock_minimo: stockMinimo
                }
            );

            setMostrarModal(false);

            setProductoSeleccionado(null);

            setMensaje({
                tipo: 'success',
                texto: response.data.message ||
                    response.data.mensaje ||
                    'Stock mínimo actualizado correctamente.'
            });

            await cargarProductos();

            return true;

        } catch (error) {

            console.error('Error al actualizar stock mínimo:', error);

            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.message ||
                    error.response?.data?.mensaje ||
                    'No se pudo actualizar el stock mínimo.'
            });

            return false;

        } finally {

            setGuardando(false);

        }

    };


    // =====================================================
    // REGISTRAR MOVIMIENTO DE STOCK
    // =====================================================

    const registrarMovimiento = async (e) => {

        e.preventDefault();

        if (!formulario.id_producto) {

            setMensaje({
                tipo: 'error',
                texto: 'No se ha seleccionado un producto.'
            });

            return;

        }

        // Si es configuración de stock mínimo
        if (tipoMovimiento === 'MINIMO') {
            await actualizarStockMinimo();
            return;
        }

        const cantidad = Number(formulario.cantidad);

        if (
            formulario.cantidad === '' ||
            !Number.isInteger(cantidad) ||
            cantidad <= 0
        ) {

            setMensaje({
                tipo: 'error',
                texto: 'La cantidad debe ser un número entero mayor a cero.'
            });

            return;

        }

        if (
            tipoMovimiento === 'SALIDA' &&
            !formulario.motivo.trim()
        ) {

            setMensaje({
                tipo: 'error',
                texto: 'Debes indicar el motivo de la salida.'
            });

            return;

        }

        const endpoints = {
            INICIAL: '/inicial',
            ENTRADA: '/entrada',
            SALIDA: '/salida'
        };

        try {

            setGuardando(true);

            const response = await axios.post(
                `${API_URL}${endpoints[tipoMovimiento]}`,
                {
                    id_producto: Number(formulario.id_producto),
                    cantidad,
                    motivo: formulario.motivo.trim()
                }
            );

            const mensajeExito = response.data.mensaje;

            setMostrarModal(false);

            setProductoSeleccionado(null);

            setFormulario({
                id_producto: '',
                cantidad: '',
                motivo: ''
            });

            setMensaje({
                tipo: 'success',
                texto: mensajeExito
            });

            await cargarProductos();

            if (vista === 'historial') {

                await cargarMovimientos(
                    productoHistorial?.id || null
                );

            }

        } catch (error) {

            console.error('Error al registrar movimiento:', error);

            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.mensaje ||
                    'No se pudo registrar el movimiento.'
            });

        } finally {

            setGuardando(false);

        }

    };


    // =====================================================
    // VER HISTORIAL INDIVIDUAL
    // =====================================================

    const verHistorialProducto = (producto) => {

        setProductoHistorial(producto);
        setVista('historial');

    };


    // =====================================================
    // VER HISTORIAL GENERAL
    // =====================================================

    const verHistorialGeneral = () => {

        setProductoHistorial(null);
        setVista('historial');

    };


    // =====================================================
    // VOLVER AL INVENTARIO
    // =====================================================

    const volverInventario = () => {

        setVista('inventario');
        setProductoHistorial(null);

    };


    // =====================================================
    // ESTADO DEL PRODUCTO
    // =====================================================

    const obtenerEstado = (producto) => {

        const stock = Number(producto.stock || 0);
        const minimo = Number(producto.stock_minimo || 0);

        if (stock === 0) {

            return {
                texto: 'Agotado',
                clase: 'bg-red-100 text-red-700',
                icono: <MdError />
            };

        }

        if (stock <= minimo) {

            return {
                texto: 'Stock bajo',
                clase: 'bg-amber-100 text-amber-700',
                icono: <MdWarning />
            };

        }

        return {
            texto: 'Disponible',
            clase: 'bg-green-100 text-green-700',
            icono: <MdCheckCircle />
        };

    };


    // =====================================================
    // FORMATO DE FECHA
    // =====================================================

    const formatoFecha = (fecha) => {

        if (!fecha) return '-';

        return new Date(fecha).toLocaleString('es-PE', {
            dateStyle: 'short',
            timeStyle: 'short'
        });

    };


    // =====================================================
    // RENDERIZADO
    // =====================================================

    return (

        <div className="max-w-7xl mx-auto px-4 py-6">

            {/* ENCABEZADO */}

            <div className="mb-6">

                <h1 className="text-2xl font-black text-slate-900">
                    Control de inventario
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                    Administra las existencias y movimientos de tus muebles.
                </p>

            </div>


            {/* MENSAJES */}

            {mensaje.texto && !mostrarModal && (

                <div className={`mb-5 p-4 rounded-xl flex items-center gap-3 ${
                    mensaje.tipo === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>

                    {mensaje.tipo === 'success'
                        ? <MdCheckCircle size={22} />
                        : <MdError size={22} />
                    }

                    <span className="text-sm font-medium">
                        {mensaje.texto}
                    </span>

                    <button
                        onClick={() => setMensaje({
                            tipo: '',
                            texto: ''
                        })}
                        className="ml-auto"
                    >
                        <MdClose size={20} />
                    </button>

                </div>

            )}


            {/* TARJETAS DE ESTADÍSTICAS */}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

                <TarjetaEstadistica
                    titulo="Productos"
                    valor={estadisticas.totalProductos}
                    icono={<MdInventory />}
                    color="blue"
                />

                <TarjetaEstadistica
                    titulo="Unidades disponibles"
                    valor={estadisticas.totalUnidades}
                    icono={<MdWarehouse />}
                    color="green"
                />

                <TarjetaEstadistica
                    titulo="Stock bajo"
                    valor={estadisticas.stockBajo}
                    icono={<MdWarning />}
                    color="amber"
                />

                <TarjetaEstadistica
                    titulo="Agotados"
                    valor={estadisticas.agotados}
                    icono={<MdError />}
                    color="red"
                />

            </div>


            {/* PESTAÑAS */}

            <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1 mb-5">

                <button
                    onClick={volverInventario}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition ${
                        vista === 'inventario'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    <MdInventory size={20} />
                    Inventario
                </button>

                <button
                    onClick={verHistorialGeneral}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition ${
                        vista === 'historial' && !productoHistorial
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    <MdHistory size={20} />
                    Movimientos
                </button>

            </div>


            {/* ================================================= */}
            {/* INVENTARIO */}
            {/* ================================================= */}

            {vista === 'inventario' && (

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                    <div className="p-4 border-b border-slate-100">

                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            Existencias de productos
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-3">

                            <div className="relative flex-1">

                                <MdSearch
                                    className="absolute left-3 top-3 text-slate-400"
                                    size={20}
                                />

                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                            </div>

                            <div className="relative">

                                <MdFilterList
                                    className="absolute left-3 top-3 text-slate-400"
                                    size={20}
                                />

                                <select
                                    value={filtro}
                                    onChange={e => setFiltro(e.target.value)}
                                    className="w-full sm:w-auto border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="TODOS">
                                        Todos los productos
                                    </option>

                                    <option value="DISPONIBLE">
                                        Disponibles
                                    </option>

                                    <option value="BAJO">
                                        Stock bajo
                                    </option>

                                    <option value="AGOTADO">
                                        Agotados
                                    </option>
                                </select>

                            </div>

                        </div>

                    </div>


                    {loading ? (

                        <div className="py-16 text-center text-slate-500">

                            <div className="animate-spin rounded-full h-9 w-9 border-4 border-indigo-600 border-t-transparent mx-auto mb-3" />

                            Cargando inventario...

                        </div>

                    ) : productosFiltrados.length === 0 ? (

                        <div className="py-16 text-center text-slate-500">

                            <MdInventory
                                size={42}
                                className="mx-auto mb-3 text-slate-300"
                            />

                            No se encontraron productos.

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full text-sm">

                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">

                                    <tr>

                                        <th className="text-left px-5 py-4">
                                            Producto
                                        </th>

                                        <th className="text-center px-5 py-4">
                                            Stock
                                        </th>

                                        <th className="text-center px-5 py-4">
                                            Mínimo
                                        </th>

                                        <th className="text-center px-5 py-4">
                                            Estado
                                        </th>

                                        <th className="text-center px-5 py-4">
                                            Acciones
                                        </th>

                                    </tr>

                                </thead>


                                <tbody className="divide-y divide-slate-100">

                                    {productosFiltrados.map(producto => {

                                        const estado = obtenerEstado(producto);

                                        return (

                                            <tr
                                                key={producto.id}
                                                className="hover:bg-slate-50 transition"
                                            >

                                                <td className="px-5 py-4">

                                                    <p className="font-bold text-slate-800">
                                                        {producto.nombre}
                                                    </p>

                                                    <p className="text-xs text-slate-400">
                                                        ID: {producto.id}
                                                    </p>

                                                </td>


                                                <td className="px-5 py-4 text-center">

                                                    <span className="font-black text-lg text-slate-800">
                                                        {producto.stock}
                                                    </span>

                                                    <span className="text-xs text-slate-400 ml-1">
                                                        unidades
                                                    </span>

                                                </td>


                                                <td className="px-5 py-4 text-center font-semibold text-slate-600">
                                                    {producto.stock_minimo}
                                                </td>


                                                <td className="px-5 py-4 text-center">

                                                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${estado.clase}`}>
                                                        {estado.icono}
                                                        {estado.texto}
                                                    </span>

                                                </td>


                                                {/* ACCIONES */}

                                                <td className="px-5 py-4">

                                                    <div className="flex justify-center items-center gap-2">

                                                        {/* AGREGAR STOCK */}

                                                        <button
                                                            onClick={() => abrirModal(
                                                                Number(producto.stock) === 0
                                                                    ? 'INICIAL'
                                                                    : 'ENTRADA',
                                                                producto
                                                            )}
                                                            title={
                                                                Number(producto.stock) === 0
                                                                    ? 'Registrar stock inicial'
                                                                    : 'Agregar stock'
                                                            }
                                                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                                                        >
                                                            <MdAdd size={21} />
                                                        </button>


                                                        {/* RETIRAR STOCK */}

                                                        <button
                                                            onClick={() => abrirModal('SALIDA', producto)}
                                                            disabled={Number(producto.stock) === 0}
                                                            title="Registrar salida"
                                                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            <MdRemove size={21} />
                                                        </button>


                                                        {/* HISTORIAL */}

                                                        <button
                                                            onClick={() => verHistorialProducto(producto)}
                                                            title="Consultar movimientos"
                                                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                                                        >
                                                            <MdHistory size={21} />
                                                        </button>


                                                        {/* STOCK MÍNIMO */}

                                                        <button
                                                            onClick={() => abrirModal('MINIMO', producto)}
                                                            title="Configurar stock mínimo"
                                                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
                                                        >
                                                            <MdTune size={21} />
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        );

                                    })}

                                </tbody>

                            </table>

                        </div>

                    )}


                    <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
                        Mostrando {productosFiltrados.length} de {productos.length} productos.
                    </div>

                </div>

            )}


            {/* ================================================= */}
            {/* HISTORIAL */}
            {/* ================================================= */}

            {vista === 'historial' && (

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                    <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">

                        <div>

                            <h2 className="font-bold text-slate-800 text-lg">
                                {productoHistorial
                                    ? `Movimientos: ${productoHistorial.nombre}`
                                    : 'Historial de movimientos'
                                }
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                {productoHistorial
                                    ? 'Movimientos registrados para este producto.'
                                    : 'Registro general de entradas, salidas y ventas.'
                                }
                            </p>

                        </div>

                        {productoHistorial && (

                            <button
                                onClick={verHistorialGeneral}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                            >
                                Ver todos
                            </button>

                        )}

                    </div>


                    {loadingMovimientos ? (

                        <div className="py-16 text-center text-slate-500">
                            Cargando movimientos...
                        </div>

                    ) : movimientos.length === 0 ? (

                        <div className="py-16 text-center text-slate-500">

                            <MdHistory
                                size={42}
                                className="mx-auto mb-3 text-slate-300"
                            />

                            No hay movimientos registrados.

                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full text-sm">

                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">

                                    <tr>

                                        <th className="text-left px-4 py-4">
                                            Fecha
                                        </th>

                                        <th className="text-left px-4 py-4">
                                            Producto
                                        </th>

                                        <th className="text-center px-4 py-4">
                                            Movimiento
                                        </th>

                                        <th className="text-center px-4 py-4">
                                            Cantidad
                                        </th>

                                        <th className="text-center px-4 py-4">
                                            Stock final
                                        </th>

                                        <th className="text-left px-4 py-4">
                                            Usuario
                                        </th>

                                    </tr>

                                </thead>


                                <tbody className="divide-y divide-slate-100">

                                    {movimientos.map(movimiento => (

                                        <tr
                                            key={movimiento.id_movimiento}
                                            className="hover:bg-slate-50"
                                        >

                                            <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                                                {formatoFecha(movimiento.fecha_movimiento)}
                                            </td>

                                            <td className="px-4 py-4 font-semibold text-slate-800">
                                                {movimiento.nombre_producto || productoHistorial?.nombre}
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <TipoMovimiento
                                                    tipo={movimiento.tipo_movimiento}
                                                />
                                            </td>

                                            <td className="px-4 py-4 text-center font-bold">
                                                {movimiento.cantidad}
                                            </td>

                                            <td className="px-4 py-4 text-center font-bold text-slate-700">
                                                {movimiento.stock_resultante}
                                            </td>

                                            <td className="px-4 py-4 text-slate-500">
                                                {movimiento.nombre_usuario || 'ADMIN'}
                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}


                    <div className="p-4 border-t border-slate-100">

                        <button
                            onClick={volverInventario}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
                        >
                            ← Volver al inventario
                        </button>

                    </div>

                </div>

            )}


            {/* ================================================= */}
            {/* MODAL COMPACTO */}
            {/* ================================================= */}

            {mostrarModal && (

                <div className="fixed inset-0 z-[100] bg-slate-950/50 flex items-center justify-center p-3">

                    <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">

                        {/* ENCABEZADO */}

                        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">

                            <div>

                                <h2 className="font-bold text-base">

                                    {tipoMovimiento === 'INICIAL'
                                        ? 'Stock inicial'
                                        : tipoMovimiento === 'ENTRADA'
                                            ? 'Entrada de stock'
                                            : tipoMovimiento === 'SALIDA'
                                                ? 'Salida de stock'
                                                : 'Configurar stock mínimo'
                                    }

                                </h2>

                                <p className="text-[11px] text-slate-300 mt-0.5">
                                    Mueblería El Márquez
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={cerrarModal}
                                disabled={guardando}
                                className="p-1.5 rounded-lg hover:bg-slate-700 transition"
                            >
                                <MdClose size={21} />
                            </button>

                        </div>


                        {/* FORMULARIO */}

                        <form
                            onSubmit={registrarMovimiento}
                            className="p-4 space-y-3"
                        >

                            {/* PRODUCTO */}

                            <div>

                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Producto
                                </label>

                                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">

                                    <p className="text-sm font-bold text-slate-800">
                                        {productoSeleccionado?.nombre}
                                    </p>

                                    <p className="text-[11px] text-slate-500">
                                        Código: {productoSeleccionado?.id}
                                    </p>

                                </div>

                            </div>


                            {/* STOCK ACTUAL */}

                            {tipoMovimiento !== 'MINIMO' && (

                                <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">

                                    <span className="text-xs font-semibold text-indigo-700">
                                        Stock actual
                                    </span>

                                    <span className="text-lg font-black text-indigo-800">
                                        {productoSeleccionado?.stock} unidades
                                    </span>

                                </div>

                            )}


                            {/* CANTIDAD */}

                            <div>

                                <label className="block text-xs font-bold text-slate-700 mb-1.5">

                                    {tipoMovimiento === 'MINIMO'
                                        ? 'Cantidad mínima de existencias'
                                        : 'Cantidad de unidades'
                                    }

                                </label>

                                <input
                                    type="number"
                                    name="cantidad"
                                    min={tipoMovimiento === 'MINIMO' ? '0' : '1'}
                                    step="1"
                                    value={formulario.cantidad}
                                    onChange={manejarCambio}
                                    required
                                    autoFocus
                                    placeholder={
                                        tipoMovimiento === 'MINIMO'
                                            ? 'Ejemplo: 5'
                                            : 'Ejemplo: 10'
                                    }
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                                {tipoMovimiento === 'MINIMO' && (

                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Cuando las existencias sean iguales o inferiores a esta cantidad, el producto aparecerá como stock bajo.
                                    </p>

                                )}

                            </div>


                            {/* MOTIVO */}

                            {tipoMovimiento !== 'MINIMO' && (

                                <div>

                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">

                                        Motivo

                                        {tipoMovimiento === 'SALIDA' && (
                                            <span className="text-red-500"> *</span>
                                        )}

                                        {tipoMovimiento !== 'SALIDA' && (
                                            <span className="text-slate-400 font-normal">
                                                {' '}(opcional)
                                            </span>
                                        )}

                                    </label>

                                    <textarea
                                        name="motivo"
                                        value={formulario.motivo}
                                        onChange={manejarCambio}
                                        rows="2"
                                        required={tipoMovimiento === 'SALIDA'}
                                        placeholder={
                                            tipoMovimiento === 'INICIAL'
                                                ? 'Inventario inicial'
                                                : tipoMovimiento === 'ENTRADA'
                                                    ? 'Compra de mercadería'
                                                    : 'Producto dañado, pérdida, etc.'
                                        }
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />

                                </div>

                            )}


                            {/* ERROR */}

                            {mensaje.tipo === 'error' && mensaje.texto && (

                                <div className="bg-red-50 text-red-700 border border-red-100 rounded-lg px-3 py-2 text-xs flex gap-2 items-center">

                                    <MdError size={17} />

                                    {mensaje.texto}

                                </div>

                            )}


                            {/* BOTONES */}

                            <div className="flex gap-2 pt-1">

                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    disabled={guardando}
                                    className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className={`flex-1 py-2.5 rounded-lg text-white text-sm font-bold transition disabled:opacity-50 ${
                                        tipoMovimiento === 'SALIDA'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : tipoMovimiento === 'MINIMO'
                                                ? 'bg-amber-500 hover:bg-amber-600'
                                                : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                >

                                    {guardando
                                        ? 'Guardando...'
                                        : tipoMovimiento === 'MINIMO'
                                            ? 'Guardar mínimo'
                                            : 'Confirmar'
                                    }

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );

}


// =====================================================
// TARJETA DE ESTADÍSTICA
// =====================================================

function TarjetaEstadistica({ titulo, valor, icono, color }) {

    const colores = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600'
    };

    return (

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl mb-3 ${colores[color]}`}>
                {icono}
            </div>

            <p className="text-2xl font-black text-slate-800">
                {valor}
            </p>

            <p className="text-xs text-slate-500 font-medium mt-1">
                {titulo}
            </p>

        </div>

    );

}


// =====================================================
// ETIQUETA DE MOVIMIENTO
// =====================================================

function TipoMovimiento({ tipo }) {

    const configuracion = {

        INICIAL: {
            texto: 'Inicial',
            clase: 'bg-indigo-100 text-indigo-700'
        },

        ENTRADA: {
            texto: 'Entrada',
            clase: 'bg-green-100 text-green-700'
        },

        SALIDA: {
            texto: 'Salida',
            clase: 'bg-red-100 text-red-700'
        },

        VENTA_MAYOR: {
            texto: 'Venta mayor',
            clase: 'bg-purple-100 text-purple-700'
        },

        VENTA_MENOR: {
            texto: 'Venta menor',
            clase: 'bg-orange-100 text-orange-700'
        }

    };

    const item = configuracion[tipo] || {
        texto: tipo,
        clase: 'bg-slate-100 text-slate-600'
    };

    return (

        <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${item.clase}`}>
            {item.texto}
        </span>

    );

}


export default StockPage;

