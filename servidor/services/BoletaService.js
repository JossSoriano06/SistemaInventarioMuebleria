
const PDFDocument = require('pdfkit');
const path = require('path');

const BoletaService = {

    generarPDF: ({ venta, detalles, tipoVenta, res }) => {

        const doc = new PDFDocument({
            size: 'A4',
            margin: 40
        });

        // Número de boleta según modalidad
        const numeroBoleta =
            tipoVenta === 'mayor'
                ? `NV-${String(venta.id_venta).padStart(6, '0')}`
                : venta.numero_comprobante;

        const fechaVenta =
            venta.fecha_vente ||
            venta.fecha_venta ||
            new Date();

        const fechaPeru = new Date(fechaVenta).toLocaleDateString(
            'es-PE',
            {
                timeZone: 'America/Lima',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }
        );

        // Configuración de respuesta PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `inline; filename=${numeroBoleta}.pdf`
        );

        doc.pipe(res);

        // ========================================
        // ENCABEZADO
        // ========================================

        const logoPath = path.join(__dirname, '../assets/logo2.png');

        try {
            doc.image(logoPath, 40, 40, {
                width: 70
            });
        } catch (error) {
            doc.fontSize(15)
                .font('Helvetica-Bold')
                .text('MUEBLERÍA', 40, 40);
        }

        doc.fillColor('#1a1a1a')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('MUEBLERÍA "EL MARQUÉZ"', 130, 45);

        doc.fontSize(9)
            .font('Helvetica')
            .text('TELF: 900000000', 130, 65)
            .text('Villa El Salvador - Lima - Perú', 130, 78);

        // ========================================
        // RECUADRO DE BOLETA
        // ========================================

        doc.rect(380, 40, 180, 75)
            .lineWidth(1.5)
            .stroke('#050a17');

        doc.fillColor('#050a17')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('NOTA DE VENTA', 390, 50, {
                width: 160,
                align: 'center'
            });

        doc.fillColor('black')
            .fontSize(12)
            .text(numeroBoleta, 390, 70, {
                width: 160,
                align: 'center'
            });

        doc.fontSize(9)
            .font('Helvetica')
            .text(`Fecha: ${fechaPeru}`, 390, 95, {
                width: 160,
                align: 'center'
            });

        // ========================================
        // DATOS DEL CLIENTE
        // ========================================

        const nombreCliente = [
            venta.nombre_cliente,
            venta.apellido_cliente
        ].filter(Boolean).join(' ');

        doc.roundedRect(40, 130, 520, 45, 5)
            .lineWidth(0.5)
            .stroke('#cccccc');

        doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('black')
            .text('CLIENTE:', 50, 140);

        doc.font('Helvetica')
            .text(nombreCliente || 'Cliente general', 105, 140);

        if (venta.dni) {
            doc.font('Helvetica-Bold')
                .text('DNI:', 50, 155);

            doc.font('Helvetica')
                .text(String(venta.dni), 105, 155);
        }

        // ========================================
        // TABLA DE PRODUCTOS
        // ========================================

        let currentY = 200;

        const dibujarCabeceraTabla = (y) => {

            doc.rect(40, y, 520, 20)
                .fill('#f3f4f6')
                .stroke('#eeeeee');

            doc.fillColor('#374151')
                .font('Helvetica-Bold')
                .fontSize(9);

            doc.text('ITEM', 45, y + 6);
            doc.text('DESCRIPCIÓN', 90, y + 6);
            doc.text('PRECIO', 350, y + 6);
            doc.text('CANT.', 430, y + 6);
            doc.text('SUBTOTAL', 490, y + 6);

            doc.fillColor('black');
            return y + 25;
        };

        currentY = dibujarCabeceraTabla(currentY);

        doc.font('Helvetica')
            .fontSize(9);

        detalles.forEach((detalle, index) => {

            // Evitar que la tabla salga del margen inferior.
            if (currentY > 700) {
                doc.addPage();
                currentY = 40;
                currentY = dibujarCabeceraTabla(currentY);
                doc.font('Helvetica')
                    .fontSize(9);
            }

            const nombreProducto =
                detalle.nombre_producto || 'Producto';

            const color = detalle.color || 'N/A';

            const precio = Number(
                detalle.precio_detalle_ventas_productos ??
                detalle.precio_unitario ??
                detalle.precio ??
                0
            );

            const cantidad = Number(
                detalle.cantidad_detalle_ventas_productos ??
                detalle.cantidad ??
                0
            );

            const subtotal = Number(
                detalle.sub_total_detalle_ventas ??
                detalle.subtotal ??
                0
            );

            doc.text(String(index + 1), 45, currentY);

            doc.text(`${nombreProducto} - ${color}`, 90, currentY, {
                width: 245
            });

            doc.text(`S/ ${precio.toFixed(2)}`, 350, currentY);

            doc.text(String(cantidad), 430, currentY);

            doc.font('Helvetica-Bold')
                .text(`S/ ${subtotal.toFixed(2)}`, 490, currentY);

            doc.font('Helvetica');

            currentY += 25;
        });

        // ========================================
        // TOTAL
        // ========================================

        if (currentY > 700) {
            doc.addPage();
            currentY = 50;
        }

        doc.rect(380, currentY + 10, 180, 25)
            .fill('#f3f4f6')
            .stroke('#eeeeee');

        doc.fillColor('#374151')
            .font('Helvetica-Bold')
            .fontSize(11);

        doc.text('TOTAL:', 390, currentY + 17);

        doc.text(
            `S/ ${Number(venta.total_venta || 0).toFixed(2)}`,
            490,
            currentY + 17
        );

        // ========================================
        // INFORMACIÓN DE PAGO
        // ========================================

        let yPago = currentY + 50;

        if (tipoVenta === 'mayor') {

            const total = Number(venta.total_venta || 0);
            const pagado = Number(venta.pago_acumulado || 0);
            const saldo = Math.max(0, total - pagado);

            doc.font('Helvetica')
                .fontSize(10)
                .fillColor('black');

            doc.text(`Monto pagado: S/ ${pagado.toFixed(2)}`, 380, yPago);

            doc.text(`Saldo pendiente: S/ ${saldo.toFixed(2)}`, 380, yPago + 18);

        } else {

            doc.font('Helvetica')
                .fontSize(10)
                .fillColor('black');

            doc.text(
                `Método de pago: ${venta.metodo_pago || 'EFECTIVO'}`,
                380,
                yPago
            );

            doc.text(
                `Monto pagado: S/ ${Number(
                    venta.monto_pagado || venta.total_venta || 0
                ).toFixed(2)}`,
                380,
                yPago + 18
            );
        }

        // ========================================
        // PIE DE BOLETA
        // ========================================

        doc.font('Helvetica-Bold')
            .fontSize(10)
            .fillColor('#1a1a1a')
            .text(
                '¡Gracias por su compra!',
                40,
                750,
                {
                    width: 520,
                    align: 'center'
                }
            );

        doc.end();
    }
};

module.exports = BoletaService;
