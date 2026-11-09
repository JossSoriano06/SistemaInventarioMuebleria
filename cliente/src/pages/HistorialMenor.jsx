
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import {
    MdArrowBack,
    MdSearch,
    MdRefresh,
    MdReceipt,
    MdVisibility,
    MdClose,
    MdShoppingBag,
    MdPerson,
    MdCalendarToday,
    MdPayments,
    MdCheckCircle,
    MdError,
    MdHistory
} from 'react-icons/md';

const BASE_URL = 'http://localhost:3004';

function HistorialMenor() {

    const navigate = useNavigate();

    const [ventas, setVentas] = useState([]);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [detalles, setDetalles] = useState([]);

    const [busqueda, setBusqueda] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const [loading, setLoading] = useState(true);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [loadingBoleta, setLoadingBoleta] = useState(false);

    const [mensaje, setMensaje] = useState({
        tipo: '',
        texto: ''
    });

    
    // FORMATO MONETARIO
    

    const formatoMoneda = (valor) => {

        return Number(valor || 0).toLocaleString('es-PE', {
            style: 'currency',
            currency: 'PEN'
        });

    };

    
    // FORMATO FECHA
    

    const formatoFecha = (fecha) => {

        if (!fecha) return '—';

        const fechaConvertida = new Date(fecha);

        if (isNaN(fechaConvertida.getTime())) {
            return fecha;
        }

        return fechaConvertida.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

    };

    const formatoFechaHora = (fecha) => {

        if (!fecha) return '—';

        const fechaConvertida = new Date(fecha);

        if (isNaN(fechaConvertida.getTime())) {
            return fecha;
        }

        return fechaConvertida.toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

    };

    
    // CARGAR HISTORIAL DE VENTAS
    

    const cargarHistorial = async () => {

        try {

            setLoading(true);

            setMensaje({
                tipo: '',
                texto: ''
            });

            const response = await axios.get(
                `${BASE_URL}/api/ventas-minoristas/historial`
            );

            const data = response.data;

            const listaVentas = Array.isArray(data)
                ? data
                : data.ventas || data.historial || [];

            setVentas(listaVentas);

        } catch (error) {

            console.error('Error al cargar historial:', error);

            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.mensaje ||
                    error.response?.data?.message ||
                    'No se pudo cargar el historial de ventas.'
            });

            setVentas([]);

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        cargarHistorial();

    }, []);

    
    // OBTENER DATOS DE LA VENTA
    

    const obtenerIdVenta = (venta) => {

        return venta.id_venta ??
            venta.id ??
            venta.id_venta_minorista;

    };

    const obtenerComprobante = (venta) => {

        return venta.numero_comprobante ??
            venta.comprobante ??
            venta.boleta ??
            venta.serie_comprobante ??
            `Venta #${obtenerIdVenta(venta)}`;

    };

    const obtenerCliente = (venta) => {

        return venta.nombre_cliente ??
            venta.cliente ??
            venta.nombres_cliente ??
            venta.nombre_completo ??
            'Cliente registrado';

    };

    const obtenerDni = (venta) => {

        return venta.dni ??
            venta.dni_cliente ??
            '—';

    };

    const obtenerFecha = (venta) => {

        return venta.fecha_venta ??
            venta.fecha ??
            venta.created_at ??
            venta.fecha_registro;

    };

    const obtenerTotal = (venta) => {

        return Number(
            venta.total ??
            venta.total_venta ??
            venta.monto_total ??
            0
        );

    };

    const obtenerMetodoPago = (venta) => {

        return venta.metodo_pago ??
            venta.forma_pago ??
            venta.tipo_pago ??
            'No especificado';

    };

    
    // FILTRAR VENTAS
    

    const ventasFiltradas = ventas.filter(venta => {

        const textoBusqueda = busqueda.toLowerCase().trim();

        const comprobante = String(
            obtenerComprobante(venta)
        ).toLowerCase();

        const cliente = String(
            obtenerCliente(venta)
        ).toLowerCase();

        const dni = String(
            obtenerDni(venta)
        ).toLowerCase();

        const coincideBusqueda =
            comprobante.includes(textoBusqueda) ||
            cliente.includes(textoBusqueda) ||
            dni.includes(textoBusqueda);

        const fechaVenta = obtenerFecha(venta);

        let coincideFecha = true;

        if (fechaVenta && (fechaInicio || fechaFin)) {

            const fecha = new Date(fechaVenta);

            if (fechaInicio) {

                const inicio = new Date(fechaInicio + 'T00:00:00');

                coincideFecha = coincideFecha &&
                    fecha >= inicio;

            }

            if (fechaFin) {

                const fin = new Date(fechaFin + 'T23:59:59');

                coincideFecha = coincideFecha &&
                    fecha <= fin;

            }

        }

        return coincideBusqueda && coincideFecha;

    });

    
    // VER DETALLE DE VENTA
    

    const verDetalle = async (venta) => {

        try {

            setLoadingDetalle(true);

            setVentaSeleccionada(venta);

            setDetalles([]);

            const idVenta = obtenerIdVenta(venta);

            const response = await axios.get(
                `${BASE_URL}/api/ventas-minoristas/${idVenta}/detalle`
            );

            const data = response.data;

            const listaDetalles = Array.isArray(data)
                ? data
                : data.detalles ||
                  data.detalle ||
                  data.productos ||
                  data.venta?.detalles ||
                  [];

            setDetalles(listaDetalles);

        } catch (error) {

            console.error('Error al consultar detalle:', error);

            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.mensaje ||
                    error.response?.data?.message ||
                    'No se pudo consultar el detalle de la venta.'
            });

            setVentaSeleccionada(null);

        } finally {

            setLoadingDetalle(false);

        }

    };

    
    // OBTENER DATOS DEL DETALLE
  

    const obtenerNombreProducto = (detalle) => {

        return detalle.nombre_producto ??
            detalle.nombre ??
            detalle.producto ??
            'Producto';

    };

    const obtenerCantidad = (detalle) => {

        return Number(
            detalle.cantidad ??
            detalle.cantidad_producto ??
            0
        );

    };

    const obtenerPrecio = (detalle) => {

        return Number(
            detalle.precio_unitario ??
            detalle.precio ??
            detalle.precio_venta ??
            0
        );

    };

    const obtenerSubtotal = (detalle) => {

        return Number(
            detalle.subtotal ??
            detalle.total_producto ??
            obtenerCantidad(detalle) * obtenerPrecio(detalle)
        );

    };

    const obtenerColor = (detalle) => {

        return detalle.color ??
            detalle.color_producto ??
            'No especificado';

    };

    
    // GENERAR / VISUALIZAR BOLETA PDF
    

    const mostrarBoletaPDF = async (idVenta) => {

        let ventanaPDF = null;

        try {

            setLoadingBoleta(true);

            // Abrir ventana desde el evento para evitar bloqueo del navegador.
            ventanaPDF = window.open('', '_blank');

            const response = await axios.get(
                `${BASE_URL}/api/boletas/menor/${idVenta}`,
                {
                    responseType: 'blob'
                }
            );

            const pdfBlob = new Blob(
                [response.data],
                {
                    type: 'application/pdf'
                }
            );

            const pdfUrl = URL.createObjectURL(pdfBlob);

            if (ventanaPDF && !ventanaPDF.closed) {

                ventanaPDF.location.href = pdfUrl;

            } else {

                const enlace = document.createElement('a');

                enlace.href = pdfUrl;
                enlace.target = '_blank';
                enlace.rel = 'noopener noreferrer';

                document.body.appendChild(enlace);

                enlace.click();

                document.body.removeChild(enlace);

            }

            window.addEventListener(
                'beforeunload',
                () => URL.revokeObjectURL(pdfUrl),
                { once: true }
            );

        } catch (error) {

            console.error('Error al abrir boleta:', error);

            if (ventanaPDF && !ventanaPDF.closed) {
                ventanaPDF.close();
            }

            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.mensaje ||
                    'No se pudo generar o visualizar la boleta.'
            });

        } finally {

            setLoadingBoleta(false);

        }

    };

   
    // LIMPIAR FILTROS


    const limpiarFiltros = () => {

        setBusqueda('');
        setFechaInicio('');
        setFechaFin('');

    };

    
    // RENDERIZADO
    

    return (

        <div className="max-w-7xl mx-auto px-4 py-6">

            {/* ENCABEZADO */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

                <div className="flex items-center gap-3">

                    <button
                        onClick={() => navigate('/venta-menor')}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                        title="Regresar a venta por menor"
                    >
                        <MdArrowBack size={22} />
                    </button>

                    <div >

                        <div className="flex items-center gap-2">

                            

                            <h1 className="text-2xl font-black text-slate-900">
                                Historial de ventas por menor
                            </h1>

                        </div>

                        

                    </div>

                </div>

                

            </div>


            {/* MENSAJE */}

            {mensaje.texto && (

                <div className={`mb-5 p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
                    mensaje.tipo === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>

                    {mensaje.tipo === 'success'
                        ? <MdCheckCircle size={21} />
                        : <MdError size={21} />
                    }

                    {mensaje.texto}

                    <button
                        onClick={() => setMensaje({
                            tipo: '',
                            texto: ''
                        })}
                        className="ml-auto"
                    >
                        <MdClose size={19} />
                    </button>

                </div>

            )}


            {/* RESUMEN */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-xs font-bold text-slate-500">
                                Ventas registradas
                            </p>

                            <p className="text-2xl font-black text-slate-900 mt-1">
                                {ventas.length}
                            </p>

                        </div>

                        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                            <MdReceipt size={24} />
                        </div>

                    </div>

                </div>


                

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">

                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-xs font-bold text-slate-500">
                                Total de ventas 
                            </p>

                            <p className="text-2xl font-black text-green-600 mt-1">
                                {formatoMoneda(
                                    ventasFiltradas.reduce(
                                        (total, venta) =>
                                            total + obtenerTotal(venta),
                                        0
                                    )
                                )}
                            </p>

                        </div>

                        <div className="bg-green-50 text-green-600 p-3 rounded-xl">
                            <MdPayments size={24} />
                        </div>

                    </div>

                </div>

            </div>


            {/* FILTROS */}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-6">

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                    <div className="md:col-span-2">

                        <label className="block text-xs font-bold text-slate-500 mb-2">
                            Buscar venta
                        </label>

                        <div className="relative">

                            <MdSearch
                                size={21}
                                className="absolute left-3 top-3 text-slate-400"
                            />

                            <input
                                type="text"
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                placeholder="DNI, cliente o número de boleta..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                            />

                        </div>

                    </div>


                    <div>

                        <label className="block text-xs font-bold text-slate-500 mb-2">
                            Fecha inicial
                        </label>

                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={e => setFechaInicio(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                    </div>


                    <div>

                        <label className="block text-xs font-bold text-slate-500 mb-2">
                            Fecha final
                        </label>

                        <input
                            type="date"
                            value={fechaFin}
                            onChange={e => setFechaFin(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                    </div>

                </div>


                <div className="flex justify-end mt-3">

                    <button
                        onClick={limpiarFiltros}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                        Limpiar filtros
                    </button>

                </div>

            </div>


            {/* TABLA DE VENTAS */}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                <div className="p-4 border-b border-slate-100 flex items-center justify-between">

                    <h2 className="font-bold text-slate-800">
                        Registro de ventas
                    </h2>

                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full">
                        {ventasFiltradas.length} registros
                    </span>

                </div>


                {loading ? (

                    <div className="py-16 text-center text-slate-500">

                        <MdRefresh
                            size={35}
                            className="animate-spin mx-auto mb-3 text-indigo-600"
                        />

                        Cargando historial...

                    </div>

                ) : ventasFiltradas.length === 0 ? (

                    <div className="py-16 text-center">

                        <MdShoppingBag
                            size={45}
                            className="mx-auto text-slate-300 mb-3"
                        />

                        <p className="font-bold text-slate-600">
                            No se encontraron ventas
                        </p>

                        <p className="text-sm text-slate-400 mt-1">
                            Intenta modificar los filtros de búsqueda.
                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                            <thead className="bg-slate-50 text-slate-500">

                                <tr>

                                    <th className="text-left px-4 py-3 font-bold">
                                        Boleta
                                    </th>

                                    <th className="text-left px-4 py-3 font-bold">
                                        Cliente
                                    </th>

                                    <th className="text-left px-4 py-3 font-bold">
                                        DNI
                                    </th>

                                    <th className="text-left px-4 py-3 font-bold">
                                        Fecha
                                    </th>

                                    <th className="text-left px-4 py-3 font-bold">
                                        Método de pago
                                    </th>

                                    <th className="text-right px-4 py-3 font-bold">
                                        Total
                                    </th>

                                    <th className="text-center px-4 py-3 font-bold">
                                        Acciones
                                    </th>

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-slate-100">

                                {ventasFiltradas.map((venta, index) => (

                                    <tr
                                        key={obtenerIdVenta(venta) ?? index}
                                        className="hover:bg-slate-50 transition"
                                    >

                                        <td className="px-4 py-4">

                                            <span className="font-bold text-indigo-600">
                                                {obtenerComprobante(venta)}
                                            </span>

                                        </td>


                                        <td className="px-4 py-4">

                                            <div className="flex items-center gap-2">

                                                <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                                                    <MdPerson size={18} />
                                                </div>

                                                <span className="font-medium text-slate-800">
                                                    {obtenerCliente(venta)}
                                                </span>

                                            </div>

                                        </td>


                                        <td className="px-4 py-4 text-slate-600">
                                            {obtenerDni(venta)}
                                        </td>


                                        <td className="px-4 py-4 text-slate-600">

                                            <div className="flex items-center gap-2">

                                                <MdCalendarToday
                                                    size={16}
                                                    className="text-slate-400"
                                                />

                                                {formatoFecha(obtenerFecha(venta))}

                                            </div>

                                        </td>


                                        <td className="px-4 py-4">

                                            <span className="inline-flex px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                                                {obtenerMetodoPago(venta)}
                                            </span>

                                        </td>


                                        <td className="px-4 py-4 text-right">

                                            <span className="font-black text-slate-900">
                                                {formatoMoneda(obtenerTotal(venta))}
                                            </span>

                                        </td>


                                        <td className="px-4 py-4">

                                            <div className="flex items-center justify-center gap-2">

                                                <button
                                                    onClick={() => verDetalle(venta)}
                                                    title="Ver detalle"
                                                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                                                >
                                                    <MdVisibility size={19} />
                                                </button>

                                                <button
                                                    onClick={() => mostrarBoletaPDF(obtenerIdVenta(venta))}
                                                    disabled={loadingBoleta}
                                                    title="Ver boleta PDF"
                                                    className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition disabled:opacity-50"
                                                >
                                                    <MdReceipt size={19} />
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* ============================================== */}
            {/* MODAL DETALLE DE VENTA */}
            {/* ============================================== */}

            {ventaSeleccionada && (

                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

                    <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">

                        {/* ENCABEZADO MODAL */}

                        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-5 flex items-center justify-between">

                            <div>

                                <h2 className="text-xl font-black text-slate-900">
                                    Detalle de venta
                                </h2>

                                <p className="text-sm text-indigo-600 font-bold mt-1">
                                    {obtenerComprobante(ventaSeleccionada)}
                                </p>

                            </div>

                            <button
                                onClick={() => {
                                    setVentaSeleccionada(null);
                                    setDetalles([]);
                                }}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                            >
                                <MdClose size={24} />
                            </button>

                        </div>


                        {/* DATOS CLIENTE */}

                        <div className="p-5">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">

                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">

                                    <p className="text-xs font-bold text-slate-500">
                                        Cliente
                                    </p>

                                    <p className="font-bold text-slate-800 mt-1">
                                        {obtenerCliente(ventaSeleccionada)}
                                    </p>

                                </div>


                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">

                                    <p className="text-xs font-bold text-slate-500">
                                        DNI
                                    </p>

                                    <p className="font-bold text-slate-800 mt-1">
                                        {obtenerDni(ventaSeleccionada)}
                                    </p>

                                </div>


                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">

                                    <p className="text-xs font-bold text-slate-500">
                                        Fecha de venta
                                    </p>

                                    <p className="font-bold text-slate-800 mt-1">
                                        {formatoFechaHora(obtenerFecha(ventaSeleccionada))}
                                    </p>

                                </div>

                            </div>


                            {/* TABLA DETALLE */}

                            <div className="border border-slate-200 rounded-xl overflow-hidden">

                                <div className="p-4 bg-slate-50 border-b border-slate-100">

                                    <h3 className="font-bold text-slate-800">
                                        Productos vendidos
                                    </h3>

                                </div>


                                {loadingDetalle ? (

                                    <div className="py-12 text-center text-slate-500">

                                        <MdRefresh
                                            size={30}
                                            className="animate-spin mx-auto mb-2 text-indigo-600"
                                        />

                                        Cargando detalle...

                                    </div>

                                ) : detalles.length === 0 ? (

                                    <div className="py-10 text-center text-slate-400">
                                        No hay productos registrados en el detalle.
                                    </div>

                                ) : (

                                    <div className="overflow-x-auto">

                                        <table className="w-full text-sm">

                                            <thead className="bg-white text-slate-500">

                                                <tr>

                                                    <th className="text-left px-4 py-3">
                                                        Producto
                                                    </th>

                                                    <th className="text-left px-4 py-3">
                                                        Color
                                                    </th>

                                                    <th className="text-center px-4 py-3">
                                                        Cantidad
                                                    </th>

                                                    <th className="text-right px-4 py-3">
                                                        Precio unitario
                                                    </th>

                                                    <th className="text-right px-4 py-3">
                                                        Subtotal
                                                    </th>

                                                </tr>

                                            </thead>


                                            <tbody className="divide-y divide-slate-100">

                                                {detalles.map((detalle, index) => (

                                                    <tr
                                                        key={
                                                            detalle.id_detalle ??
                                                            detalle.id ??
                                                            index
                                                        }
                                                    >

                                                        <td className="px-4 py-3 font-medium text-slate-800">
                                                            {obtenerNombreProducto(detalle)}
                                                        </td>

                                                        <td className="px-4 py-3 text-slate-600">
                                                            {obtenerColor(detalle)}
                                                        </td>

                                                        <td className="px-4 py-3 text-center font-bold">
                                                            {obtenerCantidad(detalle)}
                                                        </td>

                                                        <td className="px-4 py-3 text-right text-slate-600">
                                                            {formatoMoneda(obtenerPrecio(detalle))}
                                                        </td>

                                                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                                                            {formatoMoneda(obtenerSubtotal(detalle))}
                                                        </td>

                                                    </tr>

                                                ))}

                                            </tbody>

                                        </table>

                                    </div>

                                )}

                            </div>


                            {/* RESUMEN TOTAL */}

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5">

                                <div>

                                    <p className="text-xs font-bold text-slate-500">
                                        Método de pago
                                    </p>

                                    <p className="font-bold text-slate-800 mt-1">
                                        {obtenerMetodoPago(ventaSeleccionada)}
                                    </p>

                                </div>


                                <div className="bg-indigo-50 rounded-xl p-4 text-right">

                                    <p className="text-xs font-bold text-indigo-500">
                                        Total de la venta
                                    </p>

                                    <p className="text-2xl font-black text-indigo-700 mt-1">
                                        {formatoMoneda(obtenerTotal(ventaSeleccionada))}
                                    </p>

                                </div>

                            </div>


                            {/* ACCIONES MODAL */}

                            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-5">

                                <button
                                    onClick={() => mostrarBoletaPDF(
                                        obtenerIdVenta(ventaSeleccionada)
                                    )}
                                    disabled={loadingBoleta}
                                    className="flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition disabled:opacity-50"
                                >

                                    <MdReceipt size={20} />

                                    {loadingBoleta
                                        ? 'Generando boleta...'
                                        : 'Visualizar boleta PDF'
                                    }

                                </button>


                                <button
                                    onClick={() => {
                                        setVentaSeleccionada(null);
                                        setDetalles([]);
                                    }}
                                    className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition"
                                >
                                    Cerrar
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}

export default HistorialMenor;
