
const express = require('express');

module.exports = function (db) {
  const router = express.Router();

  // Consultar porcentajes actuales
  router.get('/', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT
          porcentaje_mayorista,
          porcentaje_minorista,
          fecha_actualizacion
        FROM configuracion_precios
        WHERE id_configuracion = 1
      `);

      if (rows.length === 0) {
        return res.status(404).json({
          message: 'No existe la configuración de precios'
        });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Error al consultar configuración:', error);
      res.status(500).json({
        message: 'Error al consultar la configuración de precios'
      });
    }
  });

  // Actualizar porcentajes y recalcular precios
  
  // Actualizar porcentajes y recalcular precios
  router.put('/', async (req, res) => {
    const {
      porcentaje_mayorista,
      porcentaje_minorista
    } = req.body;

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

    try {
      // Guardar los porcentajes
      const [resultado] = await db.query(
        `UPDATE configuracion_precios
         SET porcentaje_mayorista = ?,
             porcentaje_minorista = ?
         WHERE id_configuracion = 1`,
        [
          Number(porcentaje_mayorista),
          Number(porcentaje_minorista)
        ]
      );

      // Comprobar que exista la configuración
      if (resultado.affectedRows === 0) {
        const [configuracion] = await db.query(
          `SELECT id_configuracion
           FROM configuracion_precios
           WHERE id_configuracion = 1`
        );

        if (configuracion.length === 0) {
          return res.status(404).json({
            message: 'No existe la configuración de precios con ID 1'
          });
        }
      }

      // Recalcular precios de los productos existentes
      await db.query(
        `UPDATE productos
         SET precio_mayorista = ROUND(
               precio_compra * (1 + ? / 100), 2
             ),
             precio_minorista = ROUND(
               precio_compra * (1 + ? / 100), 2
             ),
             precio_producto = ROUND(
               precio_compra * (1 + ? / 100), 2
             )`,
        [
          Number(porcentaje_mayorista),
          Number(porcentaje_minorista),
          Number(porcentaje_minorista)
        ]
      );

      return res.json({
        message: 'Porcentajes actualizados y precios recalculados correctamente',
        porcentaje_mayorista: Number(porcentaje_mayorista),
        porcentaje_minorista: Number(porcentaje_minorista)
      });
    } catch (error) {
      console.error('Error al actualizar configuración:', error);

      return res.status(500).json({
        message: 'Error al actualizar los porcentajes',
        error: error.message
      });
    }
  });


  return router;
};
