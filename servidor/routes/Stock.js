
const express = require('express');

module.exports = function (db) {
    const router = express.Router();

    // Validar que la cantidad sea un número entero positivo

    function validarCantidad(cantidad) {
        return (
            Number.isInteger(Number(cantidad)) &&
            Number(cantidad) > 0
        );
    }

    function obtenerIdUsuario(req) {
        // Compatibilidad con distintas estructuras del JWT.
        return (
            req.user?.id_usuario ||
            req.user?.id ||
            req.usuario?.id_usuario ||
            req.usuario?.id ||
            null
        );
    }

    async function obtenerProductoBloqueado(connection, idProducto) {
        const [productos] = await connection.query(
            `SELECT id_producto, nombre_producto, stock
             FROM productos
             WHERE id_producto = ?
             FOR UPDATE`,
            [idProducto]
        );

        return productos[0] || null;
    }

    async function registrarMovimiento(
        connection,
        datos
    ) {
        const {
            id_producto,
            tipo_movimiento,
            cantidad,
            stock_anterior,
            stock_resultante,
            motivo,
            id_usuario
        } = datos;

        await connection.query(
            `INSERT INTO movimientos_stock (
                id_producto,
                tipo_movimiento,
                cantidad,
                stock_anterior,
                stock_resultante,
                motivo,
                id_usuario
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id_producto,
                tipo_movimiento,
                cantidad,
                stock_anterior,
                stock_resultante,
                motivo || null,
                id_usuario
            ]
        );
    }


    //consultar inventario de todos los productos 

    router.get('/', async (req, res) => {
        try {
            const [productos] = await db.query(`
                SELECT
                    id_producto AS id,
                    nombre_producto AS nombre,
                    descripcion_producto AS descripcion,
                    precio_compra,
                    precio_minorista,
                    precio_mayorista,
                    stock,
                    stock_minimo,
                    CASE
                        WHEN stock = 0 THEN 'AGOTADO'
                        WHEN stock <= stock_minimo THEN 'STOCK BAJO'
                        ELSE 'DISPONIBLE'
                    END AS estado_stock
                FROM productos
                ORDER BY nombre_producto ASC
            `);

            res.json(productos);

        } catch (error) {
            console.error('Error al consultar inventario:', error);

            res.status(500).json({
                mensaje: 'Error al consultar el inventario.'
            });
        }
    });


    //registrar stock inicial de un producto 

    router.post('/inicial', async (req, res) => {
        try {
            const {
                id_producto,
                cantidad,
                motivo
            } = req.body;

            if (
                !Number.isInteger(Number(id_producto)) ||
                Number(id_producto) <= 0 ||
                !validarCantidad(cantidad)
            ) {
                return res.status(400).json({
                    mensaje: 'Debes indicar un producto y una cantidad válida.'
                });
            }

            await db.beginTransaction();

            try {
                const producto = await obtenerProductoBloqueado(
                    db,
                    id_producto
                );

                if (!producto) {
                    throw new Error('Producto no encontrado.');
                }

                if (Number(producto.stock) !== 0) {
                    throw new Error(
                        'El producto ya tiene existencias. Utiliza una entrada de stock.'
                    );
                }

                const [movimientosIniciales] = await db.query(
                    `SELECT id_movimiento
                     FROM movimientos_stock
                     WHERE id_producto = ?
                       AND tipo_movimiento = 'INICIAL'
                     LIMIT 1`,
                    [id_producto]
                );

                if (movimientosIniciales.length > 0) {
                    throw new Error(
                        'Ya se registró el stock inicial de este producto.'
                    );
                }

                const cantidadNueva = Number(cantidad);
                const stockAnterior = Number(producto.stock);

                await db.query(
                    `UPDATE productos
                     SET stock = ?
                     WHERE id_producto = ?`,
                    [cantidadNueva, id_producto]
                );

                await registrarMovimiento(db, {
                    id_producto,
                    tipo_movimiento: 'INICIAL',
                    cantidad: cantidadNueva,
                    stock_anterior: stockAnterior,
                    stock_resultante: cantidadNueva,
                    motivo: motivo || 'Registro de stock inicial',
                    id_usuario: obtenerIdUsuario(req)
                });

                await db.commit();

                res.status(201).json({
                    mensaje: 'Stock inicial registrado correctamente.',
                    producto: producto.nombre_producto,
                    stock_anterior: stockAnterior,
                    cantidad_ingresada: cantidadNueva,
                    stock_actual: cantidadNueva
                });

            } catch (error) {
                await db.rollback();
                throw error;
            }

        } catch (error) {
            console.error('Error al registrar stock inicial:', error);

            res.status(400).json({
                mensaje: error.message || 'No se pudo registrar el stock inicial.'
            });
        }
    });


    // registrar entrada de stock 

    router.post('/entrada', async (req, res) => {
        try {
            const {
                id_producto,
                cantidad,
                motivo
            } = req.body;

            if (
                !Number.isInteger(Number(id_producto)) ||
                Number(id_producto) <= 0 ||
                !validarCantidad(cantidad)
            ) {
                return res.status(400).json({
                    mensaje: 'Debes indicar un producto y una cantidad válida.'
                });
            }

            await db.beginTransaction();

            try {
                const producto = await obtenerProductoBloqueado(
                    db,
                    id_producto
                );

                if (!producto) {
                    throw new Error('Producto no encontrado.');
                }

                const cantidadEntrada = Number(cantidad);
                const stockAnterior = Number(producto.stock);
                const stockNuevo = stockAnterior + cantidadEntrada;

                await db.query(
                    `UPDATE productos
                     SET stock = ?
                     WHERE id_producto = ?`,
                    [stockNuevo, id_producto]
                );

                await registrarMovimiento(db, {
                    id_producto,
                    tipo_movimiento: 'ENTRADA',
                    cantidad: cantidadEntrada,
                    stock_anterior: stockAnterior,
                    stock_resultante: stockNuevo,
                    motivo: motivo || 'Entrada de mercadería',
                    id_usuario: obtenerIdUsuario(req)
                });

                await db.commit();

                res.status(201).json({
                    mensaje: 'Entrada de stock registrada correctamente.',
                    producto: producto.nombre_producto,
                    stock_anterior: stockAnterior,
                    cantidad_ingresada: cantidadEntrada,
                    stock_actual: stockNuevo
                });

            } catch (error) {
                await db.rollback();
                throw error;
            }

        } catch (error) {
            console.error('Error al registrar entrada:', error);

            res.status(400).json({
                mensaje: error.message || 'No se pudo registrar la entrada.'
            });
        }
    });


    //registrar salida de stock 

    router.post('/salida', async (req, res) => {
        try {
            const {
                id_producto,
                cantidad,
                motivo
            } = req.body;

            if (
                !Number.isInteger(Number(id_producto)) ||
                Number(id_producto) <= 0 ||
                !validarCantidad(cantidad)
            ) {
                return res.status(400).json({
                    mensaje: 'Debes indicar un producto y una cantidad válida.'
                });
            }

            if (!motivo || !String(motivo).trim()) {
                return res.status(400).json({
                    mensaje: 'Debes indicar el motivo de la salida.'
                });
            }

            await db.beginTransaction();

            try {
                const producto = await obtenerProductoBloqueado(
                    db,
                    id_producto
                );

                if (!producto) {
                    throw new Error('Producto no encontrado.');
                }

                const cantidadSalida = Number(cantidad);
                const stockAnterior = Number(producto.stock);

                if (stockAnterior < cantidadSalida) {
                    throw new Error(
                        `Stock insuficiente. Disponible: ${stockAnterior}.`
                    );
                }

                const stockNuevo = stockAnterior - cantidadSalida;

                await db.query(
                    `UPDATE productos
                     SET stock = ?
                     WHERE id_producto = ?`,
                    [stockNuevo, id_producto]
                );

                await registrarMovimiento(db, {
                    id_producto,
                    tipo_movimiento: 'SALIDA',
                    cantidad: cantidadSalida,
                    stock_anterior: stockAnterior,
                    stock_resultante: stockNuevo,
                    motivo: String(motivo).trim(),
                    id_usuario: obtenerIdUsuario(req)
                });

                await db.commit();

                res.status(201).json({
                    mensaje: 'Salida de stock registrada correctamente.',
                    producto: producto.nombre_producto,
                    stock_anterior: stockAnterior,
                    cantidad_retirada: cantidadSalida,
                    stock_actual: stockNuevo
                });

            } catch (error) {
                await db.rollback();
                throw error;
            }

        } catch (error) {
            console.error('Error al registrar salida:', error);

            res.status(400).json({
                mensaje: error.message || 'No se pudo registrar la salida.'
            });
        }
    });


    //historial general de movimientos 

    router.get('/movimientos', async (req, res) => {
        try {
            const [movimientos] = await db.query(`
                SELECT
                    m.id_movimiento,
                    m.tipo_movimiento,
                    m.cantidad,
                    m.stock_anterior,
                    m.stock_resultante,
                    m.motivo,
                    m.fecha_movimiento,
                    p.id_producto,
                    p.nombre_producto,
                    u.nombre_usuario
                FROM movimientos_stock m
                INNER JOIN productos p
                    ON m.id_producto = p.id_producto
                LEFT JOIN usuarios u
                    ON m.id_usuario = u.id_usuario
                ORDER BY m.fecha_movimiento DESC,
                         m.id_movimiento DESC
            `);

            res.json(movimientos);

        } catch (error) {
            console.error('Error al consultar movimientos:', error);

            res.status(500).json({
                mensaje: 'Error al obtener el historial de movimientos.'
            });
        }
    });


    // Historial de movimientos de un producto específico

    router.get('/:id/movimientos', async (req, res) => {
        try {
            const idProducto = Number(req.params.id);

            if (!Number.isInteger(idProducto) || idProducto <= 0) {
                return res.status(400).json({
                    mensaje: 'El ID del producto no es válido.'
                });
            }

            const [movimientos] = await db.query(
                `SELECT
                    m.id_movimiento,
                    m.tipo_movimiento,
                    m.cantidad,
                    m.stock_anterior,
                    m.stock_resultante,
                    m.motivo,
                    m.fecha_movimiento,
                    u.nombre_usuario
                 FROM movimientos_stock m
                 LEFT JOIN usuarios u
                    ON m.id_usuario = u.id_usuario
                 WHERE m.id_producto = ?
                 ORDER BY m.fecha_movimiento DESC,
                          m.id_movimiento DESC`,
                [idProducto]
            );

            res.json(movimientos);

        } catch (error) {
            console.error('Error al consultar movimientos del producto:', error);

            res.status(500).json({
                mensaje: 'Error al consultar los movimientos del producto.'
            });
        }
    });


    return router;
};
