
const express = require('express');

module.exports = function (db) {
  const router = express.Router();

  // Obtener porcentajes de ganancia configurados
  async function obtenerConfiguracion() {
    const [rows] = await db.query(`
      SELECT porcentaje_mayorista, porcentaje_minorista
      FROM configuracion_precios
      WHERE id_configuracion = 1
    `);

    return rows[0] || {
      porcentaje_mayorista: 0,
      porcentaje_minorista: 0
    };
  }

  // Calcular el precio de venta a partir del costo y el margen
  function calcularPrecio(costo, porcentaje) {
    return Number(
      (Number(costo) * (1 + Number(porcentaje) / 100)).toFixed(2)
    );
  }

  function esNumeroValido(valor) {
    return valor !== undefined &&
      valor !== null &&
      valor !== '' &&
      Number.isFinite(Number(valor)) &&
      Number(valor) >= 0;
  }

  // LISTAR PRODUCTOS
  router.get('/', async (req, res) => {
    try {
      const [productos] = await db.query(`
        SELECT
          id_producto AS id,
          nombre_producto AS nombre,
          descripcion_producto AS descripcion,
          precio_producto AS precio_unitario,
          precio_compra,
          precio_mayorista,
          precio_minorista,
          stock,
          stock_minimo
        FROM productos
        ORDER BY id_producto DESC
      `);

      res.json(productos);
    } catch (error) {
      console.error('Error al listar productos:', error);
      res.status(500).json({
        message: 'Error al obtener los productos'
      });
    }
  });

  // REGISTRAR PRODUCTO
  router.post('/', async (req, res) => {
    try {
      const {
        nombre,
        descripcion,
        precio_unitario,
        precio_compra,
        precio_mayorista,
        precio_minorista,
        stock,
        stock_minimo
      } = req.body;

      if (!nombre || !String(nombre).trim()) {
        return res.status(400).json({
          message: 'El nombre del producto es obligatorio'
        });
      }

      const costoNuevo = precio_compra !== undefined &&
        precio_compra !== null &&
        precio_compra !== ''
        ? precio_compra
        : 0;

      if (!esNumeroValido(costoNuevo)) {
        return res.status(400).json({
          message: 'El precio de compra debe ser un número válido mayor o igual a cero'
        });
      }

      const stockNuevo = stock ?? 0;
      const stockMinimoNuevo = stock_minimo ?? 0;

      if (!esNumeroValido(stockNuevo) ||
          !Number.isInteger(Number(stockNuevo)) ||
          !esNumeroValido(stockMinimoNuevo) ||
          !Number.isInteger(Number(stockMinimoNuevo))) {
        return res.status(400).json({
          message: 'El stock y el stock mínimo deben ser enteros mayores o iguales a cero'
        });
      }

      let precioMayoristaNuevo;
      let precioMinoristaNuevo;

      // Si se envían precios nuevos, se respetan.
      // Si solo se envía el costo, se calculan con los márgenes configurados.
      if (precio_mayorista !== undefined &&
          precio_minorista !== undefined) {
        if (!esNumeroValido(precio_mayorista) ||
            !esNumeroValido(precio_minorista)) {
          return res.status(400).json({
            message: 'Los precios de venta deben ser números válidos mayores o iguales a cero'
          });
        }

        precioMayoristaNuevo = Number(precio_mayorista);
        precioMinoristaNuevo = Number(precio_minorista);
      } else if (precio_compra !== undefined &&
                 precio_compra !== null &&
                 precio_compra !== '') {
        const configuracion = await obtenerConfiguracion();

        precioMayoristaNuevo = calcularPrecio(
          costoNuevo,
          configuracion.porcentaje_mayorista
        );

        precioMinoristaNuevo = calcularPrecio(
          costoNuevo,
          configuracion.porcentaje_minorista
        );
      } else {
        // Compatibilidad con el formulario anterior.
        if (!esNumeroValido(precio_unitario)) {
          return res.status(400).json({
            message: 'Debes indicar un precio de venta válido'
          });
        }

        precioMinoristaNuevo = Number(precio_unitario);
        precioMayoristaNuevo = 0;
      }

      const [resultado] = await db.query(
        `INSERT INTO productos (
          nombre_producto,
          descripcion_producto,
          precio_producto,
          precio_compra,
          precio_mayorista,
          precio_minorista,
          stock,
          stock_minimo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(nombre).trim(),
          descripcion || '',
          precioMinoristaNuevo,
          Number(costoNuevo),
          precioMayoristaNuevo,
          precioMinoristaNuevo,
          Number(stockNuevo),
          Number(stockMinimoNuevo)
        ]
      );

      res.status(201).json({
        message: 'Producto registrado correctamente',
        id: resultado.insertId
      });
    } catch (error) {
      console.error('Error al registrar producto:', error);
      res.status(500).json({
        message: 'Error al registrar el producto'
      });
    }
  });

  // ACTUALIZAR PRODUCTO
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nombre,
        descripcion,
        precio_unitario,
        precio_compra,
        precio_mayorista,
        precio_minorista,
        stock,
        stock_minimo
      } = req.body;

      const [existentes] = await db.query(
        `SELECT * FROM productos WHERE id_producto = ?`,
        [id]
      );

      if (existentes.length === 0) {
        return res.status(404).json({
          message: 'Producto no encontrado'
        });
      }

      const actual = existentes[0];

      const nombreFinal = nombre !== undefined
        ? String(nombre).trim()
        : actual.nombre_producto;

      const descripcionFinal = descripcion !== undefined
        ? descripcion
        : actual.descripcion_producto;

      const costoFinal = precio_compra !== undefined
        ? precio_compra
        : actual.precio_compra;

      const stockFinal = stock !== undefined
        ? stock
        : actual.stock;

      const stockMinimoFinal = stock_minimo !== undefined
        ? stock_minimo
        : actual.stock_minimo;

      if (!nombreFinal) {
        return res.status(400).json({
          message: 'El nombre del producto es obligatorio'
        });
      }

      if (!esNumeroValido(costoFinal) ||
          !esNumeroValido(stockFinal) ||
          !Number.isInteger(Number(stockFinal)) ||
          !esNumeroValido(stockMinimoFinal) ||
          !Number.isInteger(Number(stockMinimoFinal))) {
        return res.status(400).json({
          message: 'Verifica el precio de compra, el stock y el stock mínimo'
        });
      }

      let mayoristaFinal;
      let minoristaFinal;

      if (precio_mayorista !== undefined &&
          precio_minorista !== undefined) {
        if (!esNumeroValido(precio_mayorista) ||
            !esNumeroValido(precio_minorista)) {
          return res.status(400).json({
            message: 'Los precios de venta deben ser válidos'
          });
        }

        mayoristaFinal = Number(precio_mayorista);
        minoristaFinal = Number(precio_minorista);
      } else if (precio_compra !== undefined) {
        const configuracion = await obtenerConfiguracion();

        mayoristaFinal = calcularPrecio(
          costoFinal,
          configuracion.porcentaje_mayorista
        );

        minoristaFinal = calcularPrecio(
          costoFinal,
          configuracion.porcentaje_minorista
        );
      } else if (precio_unitario !== undefined) {
        if (!esNumeroValido(precio_unitario)) {
          return res.status(400).json({
            message: 'El precio de venta debe ser válido'
          });
        }

        minoristaFinal = Number(precio_unitario);
        mayoristaFinal = Number(actual.precio_mayorista);
      } else {
        mayoristaFinal = Number(actual.precio_mayorista);
        minoristaFinal = Number(
          actual.precio_minorista ?? actual.precio_producto
        );
      }

      await db.query(
        `UPDATE productos
         SET nombre_producto = ?,
             descripcion_producto = ?,
             precio_producto = ?,
             precio_compra = ?,
             precio_mayorista = ?,
             precio_minorista = ?,
             stock = ?,
             stock_minimo = ?
         WHERE id_producto = ?`,
        [
          nombreFinal,
          descripcionFinal,
          minoristaFinal,
          Number(costoFinal),
          mayoristaFinal,
          minoristaFinal,
          Number(stockFinal),
          Number(stockMinimoFinal),
          id
        ]
      );

      res.json({
        message: 'Producto actualizado correctamente'
      });
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      res.status(500).json({
        message: 'Error al actualizar el producto'
      });
    }
  });

  // ELIMINAR PRODUCTO
  router.delete('/:id', async (req, res) => {
    try {
      const [resultado] = await db.query(
        'DELETE FROM productos WHERE id_producto = ?',
        [req.params.id]
      );

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          message: 'Producto no encontrado'
        });
      }

      res.json({
        message: 'Producto eliminado correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar producto:', error);

      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
          message: 'No se puede eliminar este producto porque tiene ventas registradas'
        });
      }

      res.status(500).json({
        message: 'Error al eliminar el producto'
      });
    }
  });

  return router;
};


