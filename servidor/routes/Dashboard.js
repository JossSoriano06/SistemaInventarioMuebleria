
const express = require('express');

module.exports = function (db) {
    const router = express.Router();

    // Convierte una fecha YYYY-MM-DD a una fecha válida.
    const validarFecha = (fecha) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) {
            return false;
        }

        const date = new Date(`${fecha}T00:00:00Z`);

        return !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === fecha;
    };

    const sumarDias = (fecha, dias) => {
        const date = new Date(`${fecha}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() + dias);
        return date.toISOString().slice(0, 10);
    };

    router.get('/resumen', async (req, res) => {
        try {
            const { periodo = 'dia', desde, hasta } = req.query;

            const periodosPermitidos = [
                'dia',
                'semana',
                'mes',
                'personalizado'
            ];

            if (!periodosPermitidos.includes(periodo)) {
                return res.status(400).json({
                    mensaje: 'El período seleccionado no es válido.'
                });
            }

            // Obtener la fecha actual desde PostgreSQL.
            const resultadoFecha = await db.query(`
                SELECT CURRENT_DATE::text AS hoy
            `);

            const hoy = resultadoFecha.rows[0].hoy;

            let fechaDesde;
            let fechaHasta;

            // Determinar el rango de fechas.
            switch (periodo) {
                case 'dia':
                    fechaDesde = hoy;
                    fechaHasta = hoy;
                    break;

                case 'semana':
                    fechaDesde = sumarDias(hoy, -6);
                    fechaHasta = hoy;
                    break;

                case 'mes':
                    fechaDesde = `${hoy.substring(0, 7)}-01`;
                    fechaHasta = hoy;
                    break;

                case 'personalizado':
                    if (!validarFecha(desde) || !validarFecha(hasta)) {
                        return res.status(400).json({
                            mensaje: 'Debes proporcionar fechas válidas en formato YYYY-MM-DD.'
                        });
                    }

                    if (desde > hasta) {
                        return res.status(400).json({
                            mensaje: 'La fecha inicial no puede ser posterior a la fecha final.'
                        });
                    }

                    fechaDesde = desde;
                    fechaHasta = hasta;
                    break;
            }

            const parametrosFecha = [fechaDesde, fechaHasta];

            // 1. Indicadores de ventas minoristas.
            const resultadoMinoristas = await db.query(`
                SELECT
                    COUNT(*) AS cantidad_ventas,
                    COALESCE(SUM(total_venta), 0) AS total_vendido,
                    COALESCE(SUM(monto_pagado), 0) AS total_cobrado
                FROM ventas_minoristas
                WHERE fecha_venta >= $1::date
                  AND fecha_venta < ($2::date + INTERVAL '1 day')
            `, parametrosFecha);

            // 2. Indicadores de ventas mayoristas.
            const resultadoMayoristas = await db.query(`
                SELECT
                    COUNT(*) AS cantidad_ventas,
                    COALESCE(SUM(total_venta), 0) AS total_vendido,
                    COALESCE(SUM(pago_acumulado), 0) AS total_cobrado
                FROM ventas
                WHERE fecha_vente >= $1::date
                  AND fecha_vente < ($2::date + INTERVAL '1 day')
            `, parametrosFecha);

            const minoristas = resultadoMinoristas.rows[0];
            const mayoristas = resultadoMayoristas.rows[0];

            // 3. Indicadores actuales del inventario.
            const resultadoInventario = await db.query(`
                SELECT
                    COUNT(*) AS total_productos,

                    COALESCE(SUM(
                        CASE WHEN stock = 0 THEN 1 ELSE 0 END
                    ), 0) AS productos_agotados,

                    COALESCE(SUM(
                        CASE
                            WHEN stock > 0 AND stock <= stock_minimo
                            THEN 1
                            ELSE 0
                        END
                    ), 0) AS productos_stock_bajo

                FROM productos
            `);

            const inventario = resultadoInventario.rows[0];

            // 4. Evolución de ventas y cobros según el período.
            const resultadoEvolucion = await db.query(`
                SELECT
                    fecha,
                    SUM(total) AS ventas,
                    SUM(cobrado) AS ingresos,
                    SUM(cantidad) AS cantidad_ventas
                FROM (
                    SELECT
                        fecha_venta::date AS fecha,
                        total_venta AS total,
                        monto_pagado AS cobrado,
                        1 AS cantidad
                    FROM ventas_minoristas
                    WHERE fecha_venta >= $1::date
                      AND fecha_venta < ($2::date + INTERVAL '1 day')

                    UNION ALL

                    SELECT
                        fecha_vente::date AS fecha,
                        total_venta AS total,
                        pago_acumulado AS cobrado,
                        1 AS cantidad
                    FROM ventas
                    WHERE fecha_vente >= $3::date
                      AND fecha_vente < ($4::date + INTERVAL '1 day')
                ) AS historial
                GROUP BY fecha
                ORDER BY fecha ASC
            `, [
                fechaDesde,
                fechaHasta,
                fechaDesde,
                fechaHasta
            ]);

            // 5. Comparación entre ventas minoristas y mayoristas.
            const ventasPorTipo = {
                minoristas: {
                    cantidad: Number(minoristas.cantidad_ventas),
                    total_vendido: Number(minoristas.total_vendido),
                    total_cobrado: Number(minoristas.total_cobrado)
                },
                mayoristas: {
                    cantidad: Number(mayoristas.cantidad_ventas),
                    total_vendido: Number(mayoristas.total_vendido),
                    total_cobrado: Number(mayoristas.total_cobrado)
                }
            };

            // 6. Compradores más recurrentes.
            const resultadoCompradores = await db.query(`
                SELECT
                    comprador,
                    nombre,
                    tipo,
                    COUNT(*) AS cantidad_compras,
                    COALESCE(SUM(total), 0) AS total_comprado,
                    MAX(fecha) AS ultima_compra
                FROM (
                    SELECT
                        c.id_clientes AS comprador,
                        CONCAT_WS(
                            ' ',
                            c.nombre_cliente,
                            c.apellido_cliente
                        ) AS nombre,
                        'MAYORISTA' AS tipo,
                        v.total_venta AS total,
                        v.fecha_vente AS fecha
                    FROM ventas v
                    INNER JOIN clientes c
                        ON c.id_clientes = v.id_cliente
                    WHERE v.fecha_vente >= $1::date
                      AND v.fecha_vente < ($2::date + INTERVAL '1 day')

                    UNION ALL

                    SELECT
                        cm.id_cliente_minorista AS comprador,
                        CONCAT_WS(
                            ' ',
                            cm.nombre_cliente,
                            cm.apellido_cliente
                        ) AS nombre,
                        'MINORISTA' AS tipo,
                        vm.total_venta AS total,
                        vm.fecha_venta AS fecha
                    FROM ventas_minoristas vm
                    INNER JOIN clientes_minoristas cm
                        ON cm.id_cliente_minorista = vm.id_cliente_minorista
                    WHERE vm.fecha_venta >= $3::date
                      AND vm.fecha_venta < ($4::date + INTERVAL '1 day')
                ) AS historial_compradores
                GROUP BY comprador, nombre, tipo
                ORDER BY cantidad_compras DESC, total_comprado DESC
                LIMIT 10
            `, [
                fechaDesde,
                fechaHasta,
                fechaDesde,
                fechaHasta
            ]);

            // 7. Últimas 8 ventas del período seleccionado.
            const resultadoUltimasVentas = await db.query(`
                SELECT *
                FROM (
                    SELECT
                        v.id_venta_minorista AS id,
                        v.numero_comprobante,
                        v.fecha_venta AS fecha,
                        v.total_venta,
                        v.monto_pagado AS pagado,
                        v.estado_pago,
                        CONCAT_WS(
                            ' ',
                            c.nombre_cliente,
                            c.apellido_cliente
                        ) AS comprador,
                        'MINORISTA' AS tipo
                    FROM ventas_minoristas v
                    LEFT JOIN clientes_minoristas c
                        ON c.id_cliente_minorista = v.id_cliente_minorista
                    WHERE v.fecha_venta >= $1::date
                      AND v.fecha_venta < ($2::date + INTERVAL '1 day')

                    UNION ALL

                    SELECT
                        v.id_venta AS id,
                        CONCAT('MAY-', v.id_venta) AS numero_comprobante,
                        v.fecha_vente AS fecha,
                        v.total_venta,
                        v.pago_acumulado AS pagado,
                        v.estado_pago,
                        CONCAT_WS(
                            ' ',
                            c.nombre_cliente,
                            c.apellido_cliente
                        ) AS comprador,
                        'MAYORISTA' AS tipo
                    FROM ventas v
                    LEFT JOIN clientes c
                        ON c.id_clientes = v.id_cliente
                    WHERE v.fecha_vente >= $3::date
                      AND v.fecha_vente < ($4::date + INTERVAL '1 day')

                ) AS historial
                ORDER BY fecha DESC
                LIMIT 8
            `, [
                fechaDesde,
                fechaHasta,
                fechaDesde,
                fechaHasta
            ]);

            // 8. Productos que necesitan reposición.
            const resultadoStockBajo = await db.query(`
                SELECT
                    id_producto,
                    nombre_producto,
                    stock,
                    stock_minimo,
                    CASE
                        WHEN stock = 0 THEN 'AGOTADO'
                        ELSE 'STOCK BAJO'
                    END AS estado
                FROM productos
                WHERE stock <= stock_minimo
                ORDER BY stock ASC
                LIMIT 8
            `);

            // 9. Consolidar todos los indicadores.
            const totalVentas =
                Number(minoristas.cantidad_ventas) +
                Number(mayoristas.cantidad_ventas);

            const totalVendido =
                Number(minoristas.total_vendido) +
                Number(mayoristas.total_vendido);

            const totalCobrado =
                Number(minoristas.total_cobrado) +
                Number(mayoristas.total_cobrado);

            res.json({
                periodo: {
                    tipo: periodo,
                    desde: fechaDesde,
                    hasta: fechaHasta
                },

                indicadores: {
                    cantidad_ventas: totalVentas,
                    total_vendido: totalVendido,
                    total_cobrado: totalCobrado,
                    pendiente_cobro: totalVendido - totalCobrado,

                    total_productos: Number(inventario.total_productos),
                    productos_agotados: Number(inventario.productos_agotados),
                    productos_stock_bajo: Number(inventario.productos_stock_bajo)
                },

                ventas_por_tipo: ventasPorTipo,

                evolucion: resultadoEvolucion.rows.map(item => ({
                    fecha: item.fecha,
                    ventas: Number(item.ventas),
                    ingresos: Number(item.ingresos),
                    cantidad_ventas: Number(item.cantidad_ventas)
                })),

                compradores_frecuentes: resultadoCompradores.rows.map(c => ({
                    comprador: c.comprador,
                    nombre: c.nombre,
                    tipo: c.tipo,
                    cantidad_compras: Number(c.cantidad_compras),
                    total_comprado: Number(c.total_comprado),
                    ultima_compra: c.ultima_compra
                })),

                ultimas_ventas: resultadoUltimasVentas.rows,

                stock_bajo: resultadoStockBajo.rows
            });

        } catch (error) {
            console.error('Error al obtener dashboard:', error);

            res.status(500).json({
                mensaje: 'Error al obtener la información del dashboard.',
                error: error.message
            });
        }
    });

    return router;
};
