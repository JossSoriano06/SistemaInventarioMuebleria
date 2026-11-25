
const express = require('express');

module.exports = function (db) {
    const router = express.Router();

    
    // OBTENER CLIENTES
    

    router.get('/', async (req, res) => {
        try {
            const resultado = await db.query(`
                SELECT
                    id_clientes,
                    nombre_cliente,
                    apellido_cliente,
                    referencia_cliente
                FROM clientes
                ORDER BY id_clientes DESC
            `);

            res.json(resultado.rows);

        } catch (error) {
            console.error('Error al obtener clientes:', error);
            res.status(500).json({
                message: 'Error al obtener clientes'
            });
        }
    });


    
    // CREAR NUEVO CLIENTE
    

    router.post('/', async (req, res) => {
        const {
            nombre_cliente,
            apellido_cliente,
            referencia_cliente
        } = req.body;

        if (!nombre_cliente || !apellido_cliente || !referencia_cliente) {
            return res.status(400).json({
                message: 'Datos incompletos'
            });
        }

        try {
            const resultado = await db.query(
                `INSERT INTO clientes (
                    nombre_cliente,
                    apellido_cliente,
                    referencia_cliente
                )
                VALUES ($1, $2, $3)
                RETURNING id_clientes`,
                [
                    nombre_cliente,
                    apellido_cliente,
                    referencia_cliente
                ]
            );

            res.status(201).json({
                id: resultado.rows[0].id_clientes
            });

        } catch (error) {
            console.error('Error al crear cliente:', error);
            res.status(500).json({
                message: 'Error al crear cliente'
            });
        }
    });


    
    // ELIMINAR CLIENTE E HISTORIAL
    

    router.delete('/:id', async (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'El ID del cliente no es válido'
            });
        }

        const client = await db.connect();

        try {
            await client.query('BEGIN');

            // Comprobar que el cliente exista
            const cliente = await client.query(
                'SELECT id_clientes FROM clientes WHERE id_clientes = $1',
                [id]
            );

            if (cliente.rows.length === 0) {
                await client.query('ROLLBACK');

                return res.status(404).json({
                    message: 'Cliente no encontrado'
                });
            }

            // Eliminar detalles de las ventas del cliente
            await client.query(`
                DELETE FROM detalle_ventas
                WHERE id_venta IN (
                    SELECT id_venta
                    FROM ventas
                    WHERE id_cliente = $1
                )
            `, [id]);

            // Eliminar abonos de las ventas del cliente
            await client.query(`
                DELETE FROM abonos
                WHERE id_venta IN (
                    SELECT id_venta
                    FROM ventas
                    WHERE id_cliente = $1
                )
            `, [id]);

            // Eliminar ventas del cliente
            await client.query(
                'DELETE FROM ventas WHERE id_cliente = $1',
                [id]
            );

            // Eliminar cliente
            await client.query(
                'DELETE FROM clientes WHERE id_clientes = $1',
                [id]
            );

            await client.query('COMMIT');

            res.json({
                message: 'Cliente y todo su historial eliminados correctamente'
            });

        } catch (error) {
            await client.query('ROLLBACK');

            console.error('Error al eliminar cliente:', error);

            res.status(500).json({
                error: 'Error interno del servidor',
                detalle: error.message
            });

        } finally {
            client.release();
        }
    });


    
    // OBTENER VENTAS POR CLIENTE
    

    router.get('/:id/ventas', async (req, res) => {
        try {
            const resultado = await db.query(`
                SELECT
                    id_venta,
                    fecha_vente,
                    total_venta,
                    pago_acumulado,
                    estado_pago
                FROM ventas
                WHERE id_cliente = $1
                ORDER BY fecha_vente DESC, id_venta DESC
            `, [req.params.id]);

            res.json(resultado.rows);

        } catch (error) {
            console.error('Error al obtener ventas:', error);

            res.status(500).json({
                message: 'Error al obtener ventas'
            });
        }
    });


    
    // OBTENER DETALLE DE UNA VENTA
    

    router.get('/ventas/:id/detalle', async (req, res) => {
        try {
            const resultado = await db.query(`
                SELECT
                    p.nombre_producto,
                    d.color,
                    d.cantidad_detalle_ventas_productos AS cantidad,
                    d.precio_detalle_ventas_productos AS precio,
                    d.sub_total_detalle_ventas AS subtotal
                FROM detalle_ventas d
                JOIN productos p
                    ON p.id_producto = d.id_producto
                WHERE d.id_venta = $1
            `, [req.params.id]);

            res.json(resultado.rows);

        } catch (error) {
            console.error('Error al obtener detalle:', error);

            res.status(500).json({
                message: 'Error al obtener detalle'
            });
        }
    });


    
    // REGISTRAR NUEVA VENTA PARA UN CLIENTE
    

    router.post('/:id/ventas', async (req, res) => {
        const idCliente = Number(req.params.id);
        const { productos, pago_inicial } = req.body;

        if (!Number.isInteger(idCliente) || idCliente <= 0) {
            return res.status(400).json({
                message: 'El ID del cliente no es válido'
            });
        }

        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({
                message: 'Carrito vacío'
            });
        }

        const montoPagado = Number(pago_inicial) || 0;

        if (!Number.isFinite(montoPagado) || montoPagado < 0) {
            return res.status(400).json({
                message: 'El pago inicial no es válido'
            });
        }

        let total = 0;

        for (const p of productos) {
            if (!p.color) {
                return res.status(400).json({
                    message: 'Producto sin color'
                });
            }

            const cantidad = Number(p.cantidad);
            const precio = Number(p.precio);

            if (
                !Number.isFinite(cantidad) ||
                !Number.isFinite(precio) ||
                cantidad <= 0 ||
                precio < 0
            ) {
                return res.status(400).json({
                    message: 'Cantidad o precio de producto no válido'
                });
            }

            total += cantidad * precio;
        }

        if (montoPagado > total) {
            return res.status(400).json({
                message: 'El pago no puede ser mayor al total'
            });
        }

        const client = await db.connect();

        try {
            await client.query('BEGIN');

            // Verificar que el cliente exista
            const cliente = await client.query(
                'SELECT id_clientes FROM clientes WHERE id_clientes = $1',
                [idCliente]
            );

            if (cliente.rows.length === 0) {
                throw new Error('Cliente no encontrado');
            }

            const estado = montoPagado === total
                ? 'cancelado'
                : 'pendiente';

            // Registrar venta y recuperar su ID
            const resultadoVenta = await client.query(`
                INSERT INTO ventas (
                    fecha_vente,
                    total_venta,
                    id_cliente,
                    pago_acumulado,
                    estado_pago
                )
                VALUES (CURRENT_DATE, $1, $2, $3, $4)
                RETURNING id_venta
            `, [
                total,
                idCliente,
                montoPagado,
                estado
            ]);

            const idVenta = resultadoVenta.rows[0].id_venta;

            // Registrar detalles de venta
            for (const p of productos) {
                await client.query(`
                    INSERT INTO detalle_ventas (
                        id_venta,
                        id_producto,
                        color,
                        cantidad_detalle_ventas_productos,
                        precio_detalle_ventas_productos,
                        sub_total_detalle_ventas
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    idVenta,
                    p.id_producto,
                    p.color,
                    Number(p.cantidad),
                    Number(p.precio),
                    Number(p.cantidad) * Number(p.precio)
                ]);
            }

            await client.query('COMMIT');

            res.json({
                message: 'Venta registrada correctamente',
                id_venta: idVenta
            });

        } catch (error) {
            await client.query('ROLLBACK');

            console.error('ERROR VENTA:', error);

            res.status(500).json({
                message: error.message
            });

        } finally {
            client.release();
        }
    });


    
    // REGISTRAR NUEVO ABONO
    

    router.post('/ventas/:id_venta/abono', async (req, res) => {
        const idVenta = Number(req.params.id_venta);
        const montoAbono = Number(req.body.monto_abono);

        if (
            !Number.isInteger(idVenta) ||
            idVenta <= 0 ||
            !Number.isFinite(montoAbono) ||
            montoAbono <= 0
        ) {
            return res.status(400).json({
                message: 'Datos del abono no válidos'
            });
        }

        const client = await db.connect();

        try {
            await client.query('BEGIN');

            // Obtener y bloquear la venta durante el abono
            const resultadoVenta = await client.query(`
                SELECT total_venta, pago_acumulado
                FROM ventas
                WHERE id_venta = $1
                FOR UPDATE
            `, [idVenta]);

            if (resultadoVenta.rows.length === 0) {
                await client.query('ROLLBACK');

                return res.status(404).json({
                    message: 'Venta no encontrada'
                });
            }

            const venta = resultadoVenta.rows[0];

            const totalVenta = Number(venta.total_venta);
            const pagoActual = Number(venta.pago_acumulado || 0);
            const nuevoPagoAcumulado = pagoActual + montoAbono;

            if (nuevoPagoAcumulado > totalVenta) {
                await client.query('ROLLBACK');

                return res.status(400).json({
                    message: 'El abono supera el saldo pendiente'
                });
            }

            // Registrar abono
            await client.query(`
                INSERT INTO abonos (id_venta, monto_abono)
                VALUES ($1, $2)
            `, [idVenta, montoAbono]);

            const nuevoEstado = nuevoPagoAcumulado === totalVenta
                ? 'cancelado'
                : 'pendiente';

            // Actualizar estado de cuenta
            await client.query(`
                UPDATE ventas
                SET pago_acumulado = $1,
                    estado_pago = $2
                WHERE id_venta = $3
            `, [
                nuevoPagoAcumulado,
                nuevoEstado,
                idVenta
            ]);

            await client.query('COMMIT');

            res.json({
                message: 'Abono registrado con éxito',
                nuevoPagoAcumulado
            });

        } catch (error) {
            await client.query('ROLLBACK');

            console.error('Error al registrar abono:', error);

            res.status(500).json({
                message: error.message
            });

        } finally {
            client.release();
        }
    });


    
    // ACTUALIZAR PAGO DE UNA VENTA
    

    router.put('/:id/abonar', async (req, res) => {
        const id = Number(req.params.id);
        const montoAbono = Number(req.body.monto_abono);

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
            !Number.isFinite(montoAbono) ||
            montoAbono <= 0
        ) {
            return res.status(400).json({
                message: 'Datos del abono no válidos'
            });
        }

        const client = await db.connect();

        try {
            await client.query('BEGIN');

            const resultado = await client.query(`
                SELECT total_venta, pago_acumulado
                FROM ventas
                WHERE id_venta = $1
                FOR UPDATE
            `, [id]);

            if (resultado.rows.length === 0) {
                await client.query('ROLLBACK');

                return res.status(404).json({
                    message: 'Venta no encontrada'
                });
            }

            const { total_venta, pago_acumulado } = resultado.rows[0];

            const nuevoTotalPago =
                Number(pago_acumulado || 0) + montoAbono;

            if (nuevoTotalPago > Number(total_venta)) {
                await client.query('ROLLBACK');

                return res.status(400).json({
                    message: 'El abono sobrepasa el total de la venta'
                });
            }

            const nuevoEstado = nuevoTotalPago === Number(total_venta)
                ? 'cancelado'
                : 'pendiente';

            // Mantener la actualización de pago original.
            // Esta ruta no insertaba registros en la tabla abonos.
            await client.query(`
                UPDATE ventas
                SET pago_acumulado = $1,
                    estado_pago = $2
                WHERE id_venta = $3
            `, [
                nuevoTotalPago,
                nuevoEstado,
                id
            ]);

            await client.query('COMMIT');

            res.json({
                message: 'Abono registrado con éxito',
                total_pagado: nuevoTotalPago
            });

        } catch (error) {
            await client.query('ROLLBACK');

            console.error('Error al actualizar pago:', error);

            res.status(500).send(error.message);

        } finally {
            client.release();
        }
    });


    
    // CONSULTAR ESTADO DE CUENTA Y ABONOS
    

    router.get('/ventas/:id/pagos', async (req, res) => {
        const id = Number(req.params.id);

        try {
            const resultadoVenta = await db.query(`
                SELECT
                    total_venta,
                    pago_acumulado,
                    estado_pago
                FROM ventas
                WHERE id_venta = $1
            `, [id]);

            if (resultadoVenta.rows.length === 0) {
                return res.status(404).json({
                    message: 'Venta no encontrada'
                });
            }

            const resultadoAbonos = await db.query(`
                SELECT *
                FROM abonos
                WHERE id_venta = $1
                ORDER BY fecha_abono DESC
            `, [id]);

            res.json({
                resumen: resultadoVenta.rows[0],
                historial: resultadoAbonos.rows
            });

        } catch (error) {
            console.error('Error al consultar pagos:', error);

            res.status(500).send(error.message);
        }
    });


    return router;
};

