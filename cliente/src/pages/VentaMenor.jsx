
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import {
    MdSearch,
    MdPerson,
    MdShoppingCart,
    MdAdd,
    MdRemove,
    MdDelete,
    MdPointOfSale,
    MdReceipt,
    MdHistory,
    MdCheckCircle,
    MdError,
    MdRefresh
} from 'react-icons/md';

const BASE_URL = 'http://localhost:3004';

function VentaMenor() {

    const navigate = useNavigate();

    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);

    const [dni, setDni] = useState('');
    const [cliente, setCliente] = useState(null);

    const [metodoPago, setMetodoPago] = useState('EFECTIVO');

    const [busqueda, setBusqueda] = useState('');

    const [loadingProductos, setLoadingProductos] = useState(true);
    const [consultandoDni, setConsultandoDni] = useState(false);
    const [procesandoVenta, setProcesandoVenta] = useState(false);

    const [mensaje, setMensaje] = useState({
        tipo: '',
        texto: ''
    });

    // =====================================================
    // CARGAR PRODUCTOS
    // =====================================================

    const cargarProductos = async () => {

        try {

            setLoadingProductos(true);

            const response = await axios.get(
                `${BASE_URL}/api/ventas-minoristas/productos`
            );

            setProductos(Array.isArray(response.data)
                ? response.data
                : response.data.productos || []
            );

        } catch (error) {

            console.error('Error al cargar productos:', error);

            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.mensaje ||
                    'No se pudieron cargar los productos.'
            });

        } finally {

            setLoadingProductos(false);

        }

    };

    useEffect(() => {
        cargarProductos();
    }, []);

    // =====================================================
    // OBTENER DATOS DEL PRODUCTO
    // =====================================================

    const obtenerId = (producto) =>
        producto.id_producto ?? producto.id;

    const obtenerNombre = (producto) =>
        producto.nombre_producto ?? producto.nombre ?? 'Producto';

    const obtenerPrecio = (producto) =>
        Number(
            producto.precio_minorista ??
            producto.precio_unitario ??
            producto.precio_producto ??
            producto.precio ??
            0
        );

    const obtenerStock = (producto) =>
        Number(producto.stock ?? 0);

    // =====================================================
    // CONSULTAR DNI Y REGISTRAR/RECUPERAR CLIENTE EN MYSQL
    // =====================================================

    const consultarDni = async () => {

        if (!/^\d{8}$/.test(dni)) {
            setMensaje({
                tipo: 'error',
                texto: 'El DNI debe contener exactamente 8 dígitos.'
            });
            return;
        }

        try {
            setConsultandoDni(true);
            setMensaje({ tipo: '', texto: '' });
            setCliente(null);

            // 1. Consultar el DNI mediante el backend (proxy de Decoleta)
            const responseDni = await axios.get(
                `${BASE_URL}/api/consulta/dni/${dni}`
            );

            const data = responseDni.data;

            const nombres = String(
                data.first_name ?? data.nombres ?? data.nombres_completos ?? ''
            ).trim();

            const apellidoPaterno = String(
                data.first_last_name ?? data.apellido_paterno ?? ''
            ).trim();

            const apellidoMaterno = String(
                data.second_last_name ?? data.apellido_materno ?? ''
            ).trim();

            const dniConsultado = String(
                data.document_number ?? data.dni ?? dni
            ).trim();

            if (!nombres || !apellidoPaterno) {
                throw new Error(
                    'La consulta DNI no devolvió nombres y apellido paterno completos.'
                );
            }

            // 2. Persistir el cliente en clientes_minoristas.
            // Si ya existe, el backend lo devuelve; si no, lo registra.
            const responseCliente = await axios.post(
                `${BASE_URL}/api/ventas-minoristas/clientes`,
                {
                    dni: dniConsultado,
                    nombres,
                    apellido_paterno: apellidoPaterno,
                    apellido_materno: apellidoMaterno
                }
            );

            const clienteDB = responseCliente.data?.cliente;

            if (!clienteDB) {
                throw new Error(
                    'El backend no devolvió los datos del cliente registrado.'
                );
            }

            // 3. Guardar el cliente confirmado por MySQL en el estado.
            const nombreCliente = String(clienteDB.nombre_cliente ?? nombres).trim();
            const apellidosCliente = String(
                clienteDB.apellido_cliente ??
                `${apellidoPaterno} ${apellidoMaterno}`.trim()
            ).trim();

            setCliente({
                dni: String(clienteDB.dni ?? dniConsultado),
                nombres: nombreCliente,
                apellidoPaterno: apellidosCliente,
                apellidoMaterno: '',
                nombreCompleto: `${nombreCliente} ${apellidosCliente}`.trim()
            });

            setMensaje({
                tipo: 'success',
                texto: responseCliente.data.mensaje ||
                    'Cliente identificado y registrado correctamente.'
            });

        } catch (error) {
            console.error('Error al consultar/registrar cliente:', error);

            setCliente(null);

            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.mensaje ||
                    error.response?.data?.message ||
                    error.message ||
                    'No se pudo consultar o registrar el cliente.'
            });

        } finally {
            setConsultandoDni(false);
        }
    };

    // =====================================================
    // AGREGAR PRODUCTO AL CARRITO
    // =====================================================

    const agregarProducto = (producto) => {

        const id = obtenerId(producto);
        const stock = obtenerStock(producto);

        if (stock <= 0) {

            setMensaje({
                tipo: 'error',
                texto: 'Este producto no tiene stock disponible.'
            });

            return;

        }

        const existente = carrito.find(
            item => item.id_producto === id
        );

        if (existente) {

            if (existente.cantidad >= stock) {

                setMensaje({
                    tipo: 'error',
                    texto: 'No puedes agregar más unidades que el stock disponible.'
                });

                return;

            }

            setCarrito(prev =>
                prev.map(item =>
                    item.id_producto === id
                        ? {
                            ...item,
                            cantidad: item.cantidad + 1,
                            subtotal:
                                (item.cantidad + 1) * item.precio_unitario
                        }
                        : item
                )
            );

        } else {

            setCarrito(prev => [
                ...prev,
                {
                    id_producto: id,
                    nombre_producto: obtenerNombre(producto),
                    color: producto.color || '',
                    cantidad: 1,
                    precio_unitario: obtenerPrecio(producto),
                    stock_disponible: stock,
                    subtotal: obtenerPrecio(producto)
                }
            ]);

        }

        setMensaje({
            tipo: '',
            texto: ''
        });

    };

    // =====================================================
    // CAMBIAR CANTIDAD
    // =====================================================

    const cambiarCantidad = (idProducto, cantidadNueva) => {

        const cantidad = Number(cantidadNueva);

        setCarrito(prev =>
            prev.map(item => {

                if (item.id_producto !== idProducto) {
                    return item;
                }

                if (
                    cantidad < 1 ||
                    cantidad > item.stock_disponible
                ) {
                    return item;
                }

                return {
                    ...item,
                    cantidad,
                    subtotal: cantidad * item.precio_unitario
                };

            })
        );

    };

    // =====================================================
    // CAMBIAR COLOR
    // =====================================================

    const cambiarColor = (idProducto, color) => {

        setCarrito(prev =>
            prev.map(item =>
                item.id_producto === idProducto
                    ? { ...item, color }
                    : item
            )
        );

    };

    // =====================================================
    // ELIMINAR PRODUCTO DEL CARRITO
    // =====================================================

    const eliminarProducto = (idProducto) => {

        setCarrito(prev =>
            prev.filter(item => item.id_producto !== idProducto)
        );

    };

    // =====================================================
    // TOTAL DE VENTA
    // =====================================================

    const totalVenta = useMemo(() => {

        return carrito.reduce(
            (total, item) => total + item.subtotal,
            0
        );

    }, [carrito]);

    // =====================================================
    // FORMATO MONETARIO
    // =====================================================

    const formatoMoneda = (valor) => {

        return Number(valor || 0).toLocaleString('es-PE', {
            style: 'currency',
            currency: 'PEN'
        });

    };

    // =====================================================
    // MOSTRAR BOLETA PDF GENERADA EN EL BACKEND
    // =====================================================

    const mostrarBoletaPDF = async (idVenta, ventanaPDF) => {

        try {
            const response = await axios.get(
                `${BASE_URL}/api/boletas/menor/${idVenta}`,
                {
                    responseType: 'blob'
                }
            );

            const pdfBlob = new Blob(
                [response.data],
                { type: 'application/pdf' }
            );

            const pdfUrl = URL.createObjectURL(pdfBlob);

            if (ventanaPDF && !ventanaPDF.closed) {
                ventanaPDF.location.href = pdfUrl;
            } else {
                // Respaldo si el navegador bloqueó la ventana emergente.
                const enlace = document.createElement('a');
                enlace.href = pdfUrl;
                enlace.target = '_blank';
                enlace.rel = 'noopener noreferrer';
                document.body.appendChild(enlace);
                enlace.click();
                document.body.removeChild(enlace);
            }

            // Mantener la URL viva para que el PDF se pueda visualizar.
            // Se revoca al salir de la página, evitando cortar la vista previa.
            window.addEventListener('beforeunload', () => {
                URL.revokeObjectURL(pdfUrl);
            }, { once: true });

        } catch (error) {
            console.error('Error al obtener la boleta PDF:', error);

            if (ventanaPDF && !ventanaPDF.closed) {
                ventanaPDF.close();
            }

            throw new Error(
                error.response?.data?.mensaje ||
                'La venta se registró, pero no se pudo abrir la boleta PDF.'
            );
        }
    };

    // =====================================================
    // REGISTRAR VENTA
    // =====================================================

    const finalizarVenta = async () => {

        if (!cliente) {

            setMensaje({
                tipo: 'error',
                texto: 'Primero debes consultar el DNI del cliente.'
            });

            return;

        }

        if (carrito.length === 0) {

            setMensaje({
                tipo: 'error',
                texto: 'Agrega al menos un producto al carrito.'
            });

            return;

        }

        const productoSinColor = carrito.find(
            item => !item.color.trim()
        );

        if (productoSinColor) {

            setMensaje({
                tipo: 'error',
                texto: `Debes seleccionar el color de ${productoSinColor.nombre_producto}.`
            });

            return;

        }

        // Abrir la ventana desde el evento del botón para evitar bloqueo del navegador.
        const ventanaPDF = window.open('', '_blank');

        try {

            setProcesandoVenta(true);

            setMensaje({
                tipo: '',
                texto: ''
            });

            const payload = {
                dni: cliente.dni,
                metodo_pago: metodoPago,
                productos: carrito.map(item => ({
                    id_producto: item.id_producto,
                    color: item.color,
                    cantidad: item.cantidad
                }))
            };

            const response = await axios.post(
                `${BASE_URL}/api/ventas-minoristas`,
                payload
            );

            // El backend devuelve la venta dentro de response.data.venta.
            const venta = response.data?.venta;

            if (!venta || !venta.id_venta) {
                if (ventanaPDF && !ventanaPDF.closed) ventanaPDF.close();
                throw new Error(
                    'La API no devolvió el ID de la venta registrada.'
                );
            }

            // Limpiar la pantalla y actualizar stock tras confirmar el registro.
            setCarrito([]);
            setDni('');
            setCliente(null);

            await cargarProductos();

            // La venta ya quedó registrada. Si falla el PDF, no tratar la venta
            // como fallida ni volver a enviar el POST (evita ventas duplicadas).
            try {
                await mostrarBoletaPDF(venta.id_venta, ventanaPDF);

                setMensaje({
                    tipo: 'success',
                    texto: `Venta ${venta.numero_comprobante || ''} registrada correctamente. Boleta PDF abierta.`
                });
            } catch (errorPDF) {
                setMensaje({
                    tipo: 'success',
                    texto: `Venta ${venta.numero_comprobante || ''} registrada correctamente. ${errorPDF.message}`
                });
            }

            setCarrito([]);
            setDni('');
            setCliente(null);

            await cargarProductos();

        } catch (error) {

            if (ventanaPDF && !ventanaPDF.closed) ventanaPDF.close();

            console.error('Error al registrar venta:', error);

            setMensaje({
                tipo: 'error',
                texto: error.response?.data?.mensaje ||
                    error.response?.data?.message ||
                    'No se pudo registrar la venta.'
            });

        } finally {

            setProcesandoVenta(false);

        }

    };

    // =====================================================
    // PRODUCTOS FILTRADOS
    // =====================================================

    const productosFiltrados = productos.filter(producto => {

        const nombre = obtenerNombre(producto).toLowerCase();

        return nombre.includes(busqueda.toLowerCase());

    });

    // =====================================================
    // RENDERIZADO
    // =====================================================

    return (

        <div className="max-w-7xl mx-auto px-4 py-6">

            {/* ENCABEZADO */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                <div>

                    <h1 className="text-2xl font-black text-slate-900">
                        Venta por menor
                    </h1>

                    <p className="text-sm text-slate-500 mt-1">
                        Registra ventas unitarias con pago completo.
                    </p>

                </div>

                <button
                    onClick={() => navigate('/historial-venta-menor')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition"
                >
                    <MdHistory size={20} />
                    Historial de ventas
                </button>

            </div>


            {/* MENSAJES */}

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
                        ×
                    </button>

                </div>

            )}


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ========================================= */}
                {/* PRODUCTOS */}
                {/* ========================================= */}

                <div className="lg:col-span-2">

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                        <div className="p-4 border-b border-slate-100">

                            <h2 className="text-lg font-bold text-slate-800 mb-3">
                                Seleccionar productos
                            </h2>

                            <div className="relative">

                                <MdSearch
                                    size={21}
                                    className="absolute left-3 top-3 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    placeholder="Buscar mueble..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                            </div>

                        </div>


                        {loadingProductos ? (

                            <div className="py-16 text-center text-slate-500">

                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto mb-3" />

                                Cargando productos...

                            </div>

                        ) : productosFiltrados.length === 0 ? (

                            <div className="py-12 text-center text-slate-500">
                                No se encontraron productos.
                            </div>

                        ) : (

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">

                                {productosFiltrados.map(producto => {

                                    const id = obtenerId(producto);

                                    const stock = obtenerStock(producto);

                                    return (

                                        <div
                                            key={id}
                                            className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition"
                                        >

                                            <div className="flex items-start justify-between gap-3">

                                                <div>

                                                    <h3 className="font-bold text-slate-800">
                                                        {obtenerNombre(producto)}
                                                    </h3>

                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Código: {id}
                                                    </p>

                                                </div>

                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                    stock > 0
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-700'
                                                }`}>
                                                    Stock: {stock}
                                                </span>

                                            </div>


                                            <div className="flex items-center justify-between mt-4">

                                                <span className="text-lg font-black text-indigo-600">
                                                    {formatoMoneda(obtenerPrecio(producto))}
                                                </span>

                                                <button
                                                    onClick={() => agregarProducto(producto)}
                                                    disabled={stock <= 0}
                                                    className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition disabled:bg-slate-300"
                                                >
                                                    <MdAdd size={18} />
                                                    Agregar
                                                </button>

                                            </div>

                                        </div>

                                    );

                                })}

                            </div>

                        )}

                    </div>

                </div>


                {/* ========================================= */}
                {/* CARRITO Y CLIENTE */}
                {/* ========================================= */}

                <div className="space-y-5">

                    {/* CLIENTE */}

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                        <div className="p-4 border-b border-slate-100 flex items-center gap-2">

                            <MdPerson
                                size={22}
                                className="text-indigo-600"
                            />

                            <h2 className="font-bold text-slate-800">
                                Datos del cliente
                            </h2>

                        </div>


                        <div className="p-4">

                            <label className="block text-xs font-bold text-slate-600 mb-2">
                                DNI del cliente
                            </label>

                            <div className="flex gap-2">

                                <input
                                    type="text"
                                    value={dni}
                                    onChange={e => {
                                        setDni(e.target.value.replace(/\D/g, '').slice(0, 8));
                                        setCliente(null);
                                    }}
                                    maxLength={8}
                                    placeholder="Ingrese DNI"
                                    className="flex-1 min-w-0 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                                <button
                                    onClick={consultarDni}
                                    disabled={consultandoDni || dni.length !== 8}
                                    className="bg-indigo-600 text-white px-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-slate-300"
                                >

                                    {consultandoDni
                                        ? <MdRefresh size={21} className="animate-spin" />
                                        : <MdSearch size={21} />
                                    }

                                </button>

                            </div>


                            {cliente && (

                                <div className="mt-3 bg-green-50 border border-green-100 rounded-xl p-3">

                                    <div className="flex items-center gap-2 text-green-700 mb-2">

                                        <MdCheckCircle size={19} />

                                        <span className="text-xs font-bold">
                                            Cliente identificado
                                        </span>

                                    </div>

                                    <p className="text-sm font-bold text-slate-800">
                                        {cliente.nombreCompleto ||
                                            `${cliente.nombres} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`}
                                    </p>

                                    <p className="text-xs text-slate-500 mt-1">
                                        DNI: {cliente.dni}
                                    </p>

                                </div>

                            )}

                        </div>

                    </div>


                    {/* CARRITO */}

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">

                            <div className="flex items-center gap-2">

                                <MdShoppingCart
                                    size={22}
                                    className="text-indigo-600"
                                />

                                <h2 className="font-bold text-slate-800">
                                    Carrito
                                </h2>

                            </div>

                            <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full">
                                {carrito.length} productos
                            </span>

                        </div>


                        {carrito.length === 0 ? (

                            <div className="py-10 text-center">

                                <MdShoppingCart
                                    size={38}
                                    className="mx-auto text-slate-300 mb-2"
                                />

                                <p className="text-sm text-slate-400">
                                    El carrito está vacío.
                                </p>

                            </div>

                        ) : (

                            <div className="p-3 space-y-3">

                                {carrito.map(item => (

                                    <div
                                        key={item.id_producto}
                                        className="border border-slate-100 rounded-xl p-3"
                                    >

                                        <div className="flex items-start justify-between gap-2">

                                            <div>

                                                <p className="text-sm font-bold text-slate-800">
                                                    {item.nombre_producto}
                                                </p>

                                                <p className="text-xs text-slate-400 mt-1">
                                                    {formatoMoneda(item.precio_unitario)} por unidad
                                                </p>

                                            </div>

                                            <button
                                                onClick={() => eliminarProducto(item.id_producto)}
                                                title="Eliminar producto"
                                                className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"
                                            >
                                                <MdDelete size={19} />
                                            </button>

                                        </div>


                                        {/* COLOR */}

                                        <div className="mt-3">

                                            <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                                Color
                                            </label>

                                            <input
                                                type="text"
                                                value={item.color}
                                                onChange={e => cambiarColor(
                                                    item.id_producto,
                                                    e.target.value
                                                )}
                                                placeholder="Ej. Negro, blanco..."
                                                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                            />

                                        </div>


                                        {/* CANTIDAD */}

                                        <div className="flex items-center justify-between mt-3">

                                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">

                                                <button
                                                    onClick={() => cambiarCantidad(
                                                        item.id_producto,
                                                        item.cantidad - 1
                                                    )}
                                                    disabled={item.cantidad <= 1}
                                                    className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                                                >
                                                    <MdRemove size={17} />
                                                </button>

                                                <span className="px-3 text-sm font-bold">
                                                    {item.cantidad}
                                                </span>

                                                <button
                                                    onClick={() => cambiarCantidad(
                                                        item.id_producto,
                                                        item.cantidad + 1
                                                    )}
                                                    disabled={item.cantidad >= item.stock_disponible}
                                                    className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                                                >
                                                    <MdAdd size={17} />
                                                </button>

                                            </div>

                                            <p className="text-sm font-black text-indigo-600">
                                                {formatoMoneda(item.subtotal)}
                                            </p>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}


                        {/* TOTAL Y PAGO */}

                        <div className="p-4 border-t border-slate-100 bg-slate-50">

                            <div className="flex items-center justify-between mb-4">

                                <span className="text-sm font-bold text-slate-600">
                                    Total a pagar
                                </span>

                                <span className="text-2xl font-black text-slate-900">
                                    {formatoMoneda(totalVenta)}
                                </span>

                            </div>


                            <label className="block text-xs font-bold text-slate-600 mb-2">
                                Método de pago
                            </label>

                            <select
                                value={metodoPago}
                                onChange={e => setMetodoPago(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white mb-4"
                            >

                                <option value="EFECTIVO">
                                    Efectivo
                                </option>

                                <option value="YAPE">
                                    Yape
                                </option>

                                <option value="PLIN">
                                    Plin
                                </option>

                                <option value="TRANSFERENCIA">
                                    Transferencia
                                </option>

                                <option value="TARJETA">
                                    Tarjeta
                                </option>

                            </select>


                            <button
                                onClick={finalizarVenta}
                                disabled={
                                    procesandoVenta ||
                                    carrito.length === 0 ||
                                    !cliente
                                }
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition shadow-md shadow-indigo-100 disabled:bg-slate-300 disabled:shadow-none"
                            >

                                {procesandoVenta ? (

                                    <>
                                        <MdRefresh
                                            size={21}
                                            className="animate-spin"
                                        />

                                        Procesando venta...

                                    </>

                                ) : (

                                    <>
                                        <MdPointOfSale size={21} />

                                        Registrar venta

                                    </>

                                )}

                            </button>


                            <p className="text-[11px] text-slate-400 text-center mt-3">
                                La venta debe pagarse completamente.
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default VentaMenor;