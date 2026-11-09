const express = require('express');
const PDFDocument = require('pdfkit');
const path = require('path');

module.exports = function (db) {
    const router = express.Router();

    // obtener cliente
    router.get('/', async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT id_clientes, nombre_cliente, apellido_cliente, referencia_cliente
                FROM clientes
                ORDER BY id_clientes DESC
            `);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener clientes' });
        }
    });
    

    // crear nuevo cliente
    router.post('/', async (req, res) => {
        const { nombre_cliente, apellido_cliente, referencia_cliente } = req.body;

        if (!nombre_cliente || !apellido_cliente || !referencia_cliente) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        try {
            const [result] = await db.query(
                'INSERT INTO clientes (nombre_cliente, apellido_cliente, referencia_cliente) VALUES (?, ?, ?)',
                [nombre_cliente, apellido_cliente, referencia_cliente]
            );
            res.status(201).json({ id: result.insertId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al crear cliente' });
        }
    });

    
    // eliminar cliente
    
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;

        try {
            // Desactivar la revisión de llaves foráneas temporalmente
            await db.query('SET FOREIGN_KEY_CHECKS = 0');

            // Borrar los detalles de ventas vinculados a las ventas de este cliente
            // Usamos un JOIN para identificar qué detalles pertenecen a las ventas del cliente
            await db.query(`
                DELETE dv FROM detalle_ventas dv
                JOIN ventas v ON dv.id_venta = v.id_venta
                WHERE v.id_cliente = ?
            `, [id]);

            // Borrar las ventas del cliente
            await db.query('DELETE FROM ventas WHERE id_cliente = ?', [id]);

            // Borrar al cliente (usando id_clientes como en tu tabla)
            const [result] = await db.query('DELETE FROM clientes WHERE id_clientes = ?', [id]);

            //Reactivar la revisión de llaves foráneas
            await db.query('SET FOREIGN_KEY_CHECKS = 1');

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Cliente no encontrado" });
            }

            res.json({ message: "Cliente y todo su historial eliminados correctamente" });

        } catch (error) {
            // Reactivar la revisión incluso si hay error
            await db.query('SET FOREIGN_KEY_CHECKS = 1');
            console.error("Error al eliminar cliente:", error);
            res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
        }
    });

    // ventas por cliente
    router.get('/:id/ventas', async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT id_venta, fecha_vente, total_venta, pago_acumulado, estado_pago
                FROM ventas
                WHERE id_cliente = ?
                ORDER BY fecha_vente DESC, id_venta DESC
            `, [req.params.id]);

            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener ventas' });
        }
    });

    // detalle de la venta
    router.get('/ventas/:id/detalle', async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT 
                    p.nombre_producto,
                    d.color,
                    d.cantidad_detalle_ventas_productos AS cantidad,
                    d.precio_detalle_ventas_productos AS precio,
                    d.sub_total_detalle_ventas AS subtotal
                FROM detalle_ventas d
                JOIN productos p ON p.id_producto = d.id_producto
                WHERE d.id_venta = ?
            `, [req.params.id]);

            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener detalle' });
        }
    });


    // crea una nueva venta para un cliente específico
    router.post('/:id/ventas', async (req, res) => {
    const id_cliente = req.params.id;
    const { productos, pago_inicial } = req.body;

    if (!productos || productos.length === 0) {
        return res.status(400).json({ message: 'Carrito vacío' });
    }

    try {
        const monto_pagado = Number(pago_inicial) || 0;
        await db.beginTransaction();

        let total = 0;
        for (const p of productos) {
            if (!p.color) {
                throw new Error('Producto sin color');
            }
            total += Number(p.cantidad) * Number(p.precio);
        }
        
        if (pago_inicial > total) {
            return res.status(400).json({ message: 'El pago no puede ser mayor al total' });
        }
        const estado = (pago_inicial === total) ? 'cancelado' : 'pendiente';
        const [venta] = await db.query(
    `INSERT INTO ventas (fecha_vente, total_venta, id_cliente, pago_acumulado, estado_pago)
     VALUES (CURDATE(), ?, ?, ?, ?)`,
    [total, id_cliente, pago_inicial, estado]
);

        const id_venta = venta.insertId;

        for (const p of productos) {
            await db.query(
                `INSERT INTO detalle_ventas (
                    id_venta,
                    id_producto,
                    color,
                    cantidad_detalle_ventas_productos,
                    precio_detalle_ventas_productos,
                    sub_total_detalle_ventas
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    id_venta,
                    p.id_producto,
                    p.color,
                    Number(p.cantidad),
                    Number(p.precio),
                    Number(p.cantidad) * Number(p.precio)
                ]
            );
        }

        await db.commit();
        res.json({ 
            message: 'Venta registrada correctamente',
            id_venta: id_venta
        });

    } catch (error) {
        await db.rollback();
        console.error('ERROR VENTA:', error.message);
        res.status(500).json({ message: error.message });
    }
});
//nuevo abono 
// Ruta para registrar un nuevo abono
router.post('/ventas/:id_venta/abono', async (req, res) => {
    const { id_venta } = req.params;
    const { monto_abono } = req.body;

    try {
        await db.beginTransaction();

        // Obtener datos actuales de la venta
        const [venta] = await db.query(
            'SELECT total_venta, pago_acumulado FROM ventas WHERE id_venta = ?',
            [id_venta]
        );

        if (venta.length === 0) throw new Error("Venta no encontrada");

        const totalVenta = Number(venta[0].total_venta);
        const pagoActual = Number(venta[0].pago_acumulado);
        const nuevoPagoAcumulado = pagoActual + Number(monto_abono);

        // Validar que no pague de más
        if (nuevoPagoAcumulado > totalVenta) {
            return res.status(400).json({ message: "El abono supera el saldo pendiente" });
        }

        // Registrar el abono en la tabla 'abonos'
        await db.query(
            'INSERT INTO abonos (id_venta, monto_abono) VALUES (?, ?)',
            [id_venta, monto_abono]
        );

        // Actualizar el pago acumulado y estado en la tabla 'ventas'
        const nuevoEstado = (nuevoPagoAcumulado === totalVenta) ? 'cancelado' : 'pendiente';
        await db.query(
            'UPDATE ventas SET pago_acumulado = ?, estado_pago = ? WHERE id_venta = ?',
            [nuevoPagoAcumulado, nuevoEstado, id_venta]
        );

        await db.commit();
        res.json({ message: "Abono registrado con éxito", nuevoPagoAcumulado });

    } catch (error) {
        await db.rollback();
        res.status(500).json({ message: error.message });
    }
});

 //para la actuzliacion del pago
 
router.put('/:id/abonar', async (req, res) => {
    const { id } = req.params;
    const { monto_abono } = req.body;

    try {
        // Obtener la venta actual
        const [rows] = await db.query('SELECT total_venta, pago_acumulado FROM ventas WHERE id_venta = ?', [id]);
        if (rows.length === 0) return res.status(404).send('Venta no encontrada');

        const { total_venta, pago_acumulado } = rows[0];
        const nuevo_total_pago = Number(pago_acumulado) + Number(monto_abono);

        // Validar que no sobrepase el total
        if (nuevo_total_pago > total_venta) {
            return res.status(400).send('El abono sobrepasa el total de la venta');
        }

        // Actualizar
        const nuevo_estado = (nuevo_total_pago === Number(total_venta)) ? 'cancelado' : 'pendiente';
        
        await db.query(
            'UPDATE ventas SET pago_acumulado = ?, estado_pago = ? WHERE id_venta = ?',
            [nuevo_total_pago, nuevo_estado, id]
        );

        res.json({ message: 'Abono registrado con éxito', total_pagado: nuevo_total_pago });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

 //ver el abono acumulado y el estado de pago
 // Obtener estado de cuenta de una venta
router.get('/ventas/:id/pagos', async (req, res) => {
    const { id } = req.params;
    try {
        const [venta] = await db.query(
            'SELECT total_venta, pago_acumulado, estado_pago FROM ventas WHERE id_venta = ?', 
            [id]
        );
        const [abonos] = await db.query(
            'SELECT * FROM abonos WHERE id_venta = ? ORDER BY fecha_abono DESC', 
            [id]
        );
        
        res.json({
            resumen: venta[0],
            historial: abonos
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});




    return router;
};



    
