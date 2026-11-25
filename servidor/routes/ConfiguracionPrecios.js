
const express = require('express');

module.exports = function (db) {
    const router = express.Router();

    // CONSULTAR PORCENTAJES ACTUALES

    router.get('/', async (req, res) => {
        try {
            const resultado = await db.query(`
                SELECT
                    porcentaje_mayorista,
                    porcentaje_minorista,
                    fecha_actualizacion
                FROM configuracion_precios
                WHERE id_configuracion = 1
            `);

            if (resultado.rows.length === 0) {
                return res.status(404).json({
                    message: 'No existe la configuración de precios'
                });
            }

            return res.json(resultado.rows[0]);

        } catch (error) {
            console.error('Error al consultar configuración:', error);

            return res.status(500).json({
                message: 'Error al consultar la configuración de precios'
            });
        }
    });


    // ACTUALIZAR PORCENTAJES Y RECALCULAR PRECIOS

    router.put('/', async (req, res) => {
        const {
            porcentaje_mayorista,
            porcentaje_minorista
        } = req.body;

        // Validar porcentajes
        const valores = [
            porcentaje_mayorista,
            porcentaje_minorista
        ];

        const porcentajesValidos = valores.every((valor) =>
            valor !== undefined &&
            valor !== null &&
            valor !== '' &&
            Number.isFinite(Number(valor)) &&
            Number(valor) >= 0 &&
            Number(valor) <= 999.99
        );

        if (!porcentajesValidos) {
            return res.status(400).json({
                message: 'Ambos porcentajes deben estar entre 0 y 999.99'
            });
        }

        const mayorista = Number(porcentaje_mayorista);
        const minorista = Number(porcentaje_minorista);

        const client = await db.connect();

        try {
            await client.query('BEGIN');

            // 1. Comprobar que exista la configuración
            const configuracion = await client.query(`
                SELECT id_configuracion
                FROM configuracion_precios
                WHERE id_configuracion = 1
                FOR UPDATE
            `);

            if (configuracion.rows.length === 0) {
                await client.query('ROLLBACK');

                return res.status(404).json({
                    message: 'No existe la configuración de precios con ID 1'
                });
            }

            // 2. Actualizar porcentajes
            await client.query(`
                UPDATE configuracion_precios
                SET
                    porcentaje_mayorista = $1,
                    porcentaje_minorista = $2,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_configuracion = 1
            `, [
                mayorista,
                minorista
            ]);

            // 3. Recalcular precios de todos los productos
            await client.query(`
                UPDATE productos
                SET
                    precio_mayorista = ROUND(
                        precio_compra * (1 + $1 / 100.0), 2
                    ),
                    precio_minorista = ROUND(
                        precio_compra * (1 + $2 / 100.0), 2
                    ),
                    precio_producto = ROUND(
                        precio_compra * (1 + $2 / 100.0), 2
                    )
            `, [
                mayorista,
                minorista
            ]);

            // 4. Confirmar transacción
            await client.query('COMMIT');

            return res.json({
                message: 'Porcentajes actualizados y precios recalculados correctamente',
                porcentaje_mayorista: mayorista,
                porcentaje_minorista: minorista
            });

        } catch (error) {
            await client.query('ROLLBACK');

            console.error('Error al actualizar configuración:', error);

            return res.status(500).json({
                message: 'Error al actualizar los porcentajes',
                error: error.message
            });

        } finally {
            client.release();
        }
    });

    return router;
};
