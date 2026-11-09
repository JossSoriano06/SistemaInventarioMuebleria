
const express = require('express');

module.exports = function (db) {
    const router = express.Router();

    //listar productos 
    router.get('/productos', async (req, res) => {
        try {
            const [productos] = await db.query(`
                SELECT
                    id_producto AS id,
                    nombre_producto AS nombre,
                    descripcion_producto AS descripcion,
                    precio_minorista,
                    stock
                FROM productos
                WHERE stock > 0
                ORDER BY nombre_producto ASC
            `);

            res.json(productos);

        } catch (error) {
            console.error('Error al listar productos minoristas:', error);

            res.status(500).json({
                mensaje: 'Error al obtener los productos.'
            });
        }
    });


    //datos de cliente por dni 
    router.post('/clientes', async (req, res) => {
        try {
            const {
                dni,
                nombres,
                apellido_paterno,
                apellido_materno
            } = req.body;

            if (!dni || !/^\d{8}$/.test(String(dni))) {
                return res.status(400).json({
                    mensaje: 'El DNI debe contener exactamente 8 dígitos.'
                });
            }

            if (!nombres || !apellido_paterno) {
                return res.status(400).json({
                    mensaje: 'Los nombres y el apellido paterno son obligatorios.'
                });
            }

            const apellidoCompleto = [
                apellido_paterno,
                apellido_materno
            ].filter(Boolean).join(' ');

            const [clientes] = await db.query(
                `SELECT *
                 FROM clientes_minoristas
                 WHERE dni = ?`,
                [dni]
            );

            // Si el cliente ya existe, devolver sus datos.
            if (clientes.length > 0) {
                return res.json({
                    mensaje: 'Cliente encontrado.',
                    cliente: clientes[0]
                });
            }

            const [resultado] = await db.query(
                `INSERT INTO clientes_minoristas
                    (dni, nombre_cliente, apellido_cliente)
                 VALUES (?, ?, ?)`,
                [dni, nombres.trim(), apellidoCompleto.trim()]
            );

            const [nuevoCliente] = await db.query(
                `SELECT *
                 FROM clientes_minoristas
                 WHERE id_cliente_minorista = ?`,
                [resultado.insertId]
            );

            res.status(201).json({
                mensaje: 'Cliente registrado correctamente.',
                cliente: nuevoCliente[0]
            });

        } catch (error) {
            console.error('Error al registrar cliente minorista:', error);

            res.status(500).json({
                mensaje: 'Error al registrar el cliente.'
            });
        }
    });


    //registrar nueva venta
    router.post('/', async (req, res) => {

        try {
            const {
                dni,
                productos,
                metodo_pago
            } = req.body;

            if (!dni || !/^\d{8}$/.test(String(dni))) {
                return res.status(400).json({
                    mensaje: 'Debes proporcionar un DNI válido.'
                });
            }

            if (!Array.isArray(productos) || productos.length === 0) {
                return res.status(400).json({
                    mensaje: 'Debes agregar al menos un producto.'
                });
            }

            const metodosPermitidos = [
                'EFECTIVO',
                'YAPE',
                'PLIN',
                'TRANSFERENCIA',
                'TARJETA'
            ];

            const metodoPago = String(metodo_pago || 'EFECTIVO')
                .trim()
                .toUpperCase();

            if (!metodosPermitidos.includes(metodoPago)) {
                return res.status(400).json({
                    mensaje: 'El método de pago no es válido.'
                });
            }

            // Validar productos recibidos.
            for (const producto of productos) {
                if (
                    !Number.isInteger(Number(producto.id_producto)) ||
                    Number(producto.id_producto) <= 0 ||
                    !Number.isInteger(Number(producto.cantidad)) ||
                    Number(producto.cantidad) <= 0 ||
                    !producto.color ||
                    !String(producto.color).trim()
                ) {
                    return res.status(400).json({
                        mensaje: 'Verifica el producto, color y cantidad.'
                    });
                }
            }

            await db.beginTransaction();

            try {
                // Buscar cliente.
                const [clientes] = await db.query(
                    `SELECT id_cliente_minorista
                     FROM clientes_minoristas
                     WHERE dni = ?
                     FOR UPDATE`,
                    [dni]
                );

                if (clientes.length === 0) {
                    await db.rollback();

                    return res.status(404).json({
                        mensaje: 'El cliente no está registrado. Primero consulta y registra su DNI.'
                    });
                }

                const idCliente = clientes[0].id_cliente_minorista;

                // Agrupar productos repetidos para validar correctamente el stock.
                const cantidades = new Map();

                for (const producto of productos) {
                    const id = Number(producto.id_producto);

                    cantidades.set(
                        id,
                        (cantidades.get(id) || 0) + Number(producto.cantidad)
                    );
                }

                const productosValidados = [];
                let totalVenta = 0;

                // Verificar precios y stock directamente en MySQL.
                for (const [idProducto, cantidad] of cantidades) {

                    const [rows] = await db.query(
                        `SELECT
                            id_producto,
                            nombre_producto,
                            precio_minorista,
                            stock
                         FROM productos
                         WHERE id_producto = ?
                         FOR UPDATE`,
                        [idProducto]
                    );

                    if (rows.length === 0) {
                        throw new Error(
                            `El producto con ID ${idProducto} no existe.`
                        );
                    }

                    const productoDB = rows[0];
                    const stockActual = Number(productoDB.stock);
                    const precio = Number(productoDB.precio_minorista);

                    if (stockActual < cantidad) {
                        throw new Error(
                            `Stock insuficiente para ${productoDB.nombre_producto}. Disponible: ${stockActual}.`
                        );
                    }

                    if (!Number.isFinite(precio) || precio < 0) {
                        throw new Error(
                            `El precio minorista de ${productoDB.nombre_producto} no es válido.`
                        );
                    }

                    const subtotal = Number(
                        (precio * cantidad).toFixed(2)
                    );

                    totalVenta = Number(
                        (totalVenta + subtotal).toFixed(2)
                    );

                    // Recuperar el color de cada línea original.
                    const lineas = productos.filter(
                        p => Number(p.id_producto) === idProducto
                    );

                    for (const linea of lineas) {
                        const cantidadLinea = Number(linea.cantidad);

                        const subtotalLinea = Number(
                            (precio * cantidadLinea).toFixed(2)
                        );

                        productosValidados.push({
                            id_producto: idProducto,
                            nombre: productoDB.nombre_producto,
                            color: String(linea.color).trim(),
                            cantidad: cantidadLinea,
                            precio_unitario: precio,
                            subtotal: subtotalLinea
                        });
                    }
                }

                // El cliente debe pagar el total completo.
                const montoPagado = totalVenta;

                // Obtener correlativo y bloquear la fila.
                const [series] = await db.query(
                    `SELECT id, serie, correlativo
                     FROM boleta_serie_minorista
                     ORDER BY id ASC
                     LIMIT 1
                     FOR UPDATE`
                );

                if (series.length === 0) {
                    throw new Error(
                        'No existe una serie configurada para comprobantes minoristas.'
                    );
                }

                const serie = series[0].serie;
                const nuevoCorrelativo = Number(series[0].correlativo) + 1;

                const numeroComprobante =
                    `${serie}-${String(nuevoCorrelativo).padStart(8, '0')}`;

                await db.query(
                    `UPDATE boleta_serie_minorista
                     SET correlativo = ?
                     WHERE id = ?`,
                    [nuevoCorrelativo, series[0].id]
                );

                // Registrar cabecera de venta.
                const [venta] = await db.query(
                    `INSERT INTO ventas_minoristas (
                        numero_comprobante,
                        id_cliente_minorista,
                        total_venta,
                        monto_pagado,
                        metodo_pago,
                        estado_pago
                    ) VALUES (?, ?, ?, ?, ?, 'CANCELADO')`,
                    [
                        numeroComprobante,
                        idCliente,
                        totalVenta,
                        montoPagado,
                        metodoPago
                    ]
                );

                const idVenta = venta.insertId;

                // Registrar detalles y descontar stock.
                for (const producto of productosValidados) {

                    await db.query(
                        `INSERT INTO detalle_ventas_minoristas (
                            id_venta_minorista,
                            id_producto,
                            color,
                            cantidad,
                            precio_unitario,
                            subtotal
                        ) VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            idVenta,
                            producto.id_producto,
                            producto.color,
                            producto.cantidad,
                            producto.precio_unitario,
                            producto.subtotal
                        ]
                    );

                    const [actualizacion] = await db.query(
                        `UPDATE productos
                         SET stock = stock - ?
                         WHERE id_producto = ?
                           AND stock >= ?`,
                        [
                            producto.cantidad,
                            producto.id_producto,
                            producto.cantidad
                        ]
                    );

                    if (actualizacion.affectedRows !== 1) {
                        throw new Error(
                            `No se pudo actualizar el stock del producto ${producto.nombre}.`
                        );
                    }
                }

                await db.commit();

                res.status(201).json({
                    mensaje: 'Venta minorista registrada correctamente.',
                    venta: {
                        id_venta: idVenta,
                        numero_comprobante: numeroComprobante,
                        dni: dni,
                        productos: productosValidados,
                        total: totalVenta,
                        monto_pagado: montoPagado,
                        metodo_pago: metodoPago,
                        estado_pago: 'CANCELADO'
                    }
                });

            } catch (error) {
                await db.rollback();
                throw error;
            }

        } catch (error) {
            console.error('Error al registrar venta minorista:', error);

            res.status(400).json({
                mensaje: error.message || 'No se pudo registrar la venta.'
            });
        }
    });


    //historial
    router.get('/historial', async (req, res) => {
        try {
            const [ventas] = await db.query(`
                SELECT
                    v.id_venta_minorista AS id_venta,
                    v.numero_comprobante,
                    v.fecha_venta,
                    v.total_venta,
                    v.monto_pagado,
                    v.metodo_pago,
                    v.estado_pago,
                    c.dni,
                    c.nombre_cliente,
                    c.apellido_cliente
                FROM ventas_minoristas v
                INNER JOIN clientes_minoristas c
                    ON v.id_cliente_minorista = c.id_cliente_minorista
                ORDER BY v.id_venta_minorista DESC
            `);

            res.json(ventas);

        } catch (error) {
            console.error('Error al obtener historial minorista:', error);

            res.status(500).json({
                mensaje: 'Error al obtener el historial de ventas.'
            });
        }
    });


    //detalle venta
    router.get('/:id/detalle', async (req, res) => {
        try {
            const idVenta = Number(req.params.id);

            if (!Number.isInteger(idVenta) || idVenta <= 0) {
                return res.status(400).json({
                    mensaje: 'El ID de venta no es válido.'
                });
            }

            const [ventas] = await db.query(
                `SELECT
                    v.*,
                    c.dni,
                    c.nombre_cliente,
                    c.apellido_cliente
                 FROM ventas_minoristas v
                 INNER JOIN clientes_minoristas c
                    ON v.id_cliente_minorista = c.id_cliente_minorista
                 WHERE v.id_venta_minorista = ?`,
                [idVenta]
            );

            if (ventas.length === 0) {
                return res.status(404).json({
                    mensaje: 'Venta minorista no encontrada.'
                });
            }

            const [detalles] = await db.query(
                `SELECT
                    d.id_detalle_minorista,
                    d.id_producto,
                    p.nombre_producto,
                    d.color,
                    d.cantidad,
                    d.precio_unitario,
                    d.subtotal
                 FROM detalle_ventas_minoristas d
                 INNER JOIN productos p
                    ON d.id_producto = p.id_producto
                 WHERE d.id_venta_minorista = ?
                 ORDER BY d.id_detalle_minorista ASC`,
                [idVenta]
            );

            res.json({
                venta: ventas[0],
                detalles: detalles
            });

        } catch (error) {
            console.error('Error al obtener detalle minorista:', error);

            res.status(500).json({
                mensaje: 'Error al obtener el detalle de la venta.'
            });
        }
    });


    return router;
};
