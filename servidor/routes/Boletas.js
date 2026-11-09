
const express = require('express');
const BoletaService = require('../services/BoletaService');

module.exports = function (db) {

    const router = express.Router();

    // ========================================
    // BOLETA DE VENTA POR MAYOR
    // ========================================

    router.get('/mayor/:id_venta', async (req, res) => {

        try {

            const idVenta = Number(req.params.id_venta);

            if (!Number.isInteger(idVenta) || idVenta <= 0) {
                return res.status(400).json({
                    message: 'El ID de venta no es válido.'
                });
            }

            const [ventas] = await db.query(`
                SELECT
                    v.*,
                    c.nombre_cliente,
                    c.apellido_cliente
                FROM ventas v
                INNER JOIN clientes c
                    ON v.id_cliente = c.id_clientes
                WHERE v.id_venta = ?
            `, [idVenta]);

            if (ventas.length === 0) {
                return res.status(404).json({
                    message: 'Venta mayorista no encontrada.'
                });
            }

            const [detalles] = await db.query(`
                SELECT
                    dv.*,
                    p.nombre_producto
                FROM detalle_ventas dv
                INNER JOIN productos p
                    ON dv.id_producto = p.id_producto
                WHERE dv.id_venta = ?
            `, [idVenta]);

            BoletaService.generarPDF({
                venta: ventas[0],
                detalles,
                tipoVenta: 'mayor',
                res
            });

        } catch (error) {

            console.error('Error al generar boleta mayorista:', error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: 'Error al generar la boleta mayorista.'
                });
            }
        }
    });


    // ========================================
    // BOLETA DE VENTA POR MENOR
    // ========================================

    router.get('/menor/:id_venta', async (req, res) => {

        try {

            const idVenta = Number(req.params.id_venta);

            if (!Number.isInteger(idVenta) || idVenta <= 0) {
                return res.status(400).json({
                    message: 'El ID de venta no es válido.'
                });
            }

            const [ventas] = await db.query(`
                SELECT
                    v.*,
                    c.dni,
                    c.nombre_cliente,
                    c.apellido_cliente
                FROM ventas_minoristas v
                INNER JOIN clientes_minoristas c
                    ON v.id_cliente_minorista = c.id_cliente_minorista
                WHERE v.id_venta_minorista = ?
            `, [idVenta]);

            if (ventas.length === 0) {
                return res.status(404).json({
                    message: 'Venta minorista no encontrada.'
                });
            }

            const [detalles] = await db.query(`
                SELECT
                    d.*,
                    p.nombre_producto
                FROM detalle_ventas_minoristas d
                INNER JOIN productos p
                    ON d.id_producto = p.id_producto
                WHERE d.id_venta_minorista = ?
                ORDER BY d.id_detalle_minorista ASC
            `, [idVenta]);

            BoletaService.generarPDF({
                venta: ventas[0],
                detalles,
                tipoVenta: 'menor',
                res
            });

        } catch (error) {

            console.error('Error al generar boleta minorista:', error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: 'Error al generar la boleta minorista.'
                });
            }
        }
    });


    return router;
};
