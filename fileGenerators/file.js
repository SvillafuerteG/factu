const Counter = require('../models/counter'); // Ajusta la ruta según sea necesario

// Función para obtener el siguiente número de factura
const getNextFacturaNumber = async () => {
    const counter = await Counter.findOneAndUpdate(
        { key: 'factura' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
};

const generateXML = async (factura) => {
    try {
        const cliente = await Cliente.findOne({ nombreComercial: factura.nombreComercial }).lean();

        if (!cliente) {
            throw new Error('Cliente no encontrado en la base de datos');
        }

        const numeroFactura = await getNextFacturaNumber();

        const xml = xmlbuilder.create('Factura')
            .ele('NumeroFactura', numeroFactura)
            .ele('Cliente')
                .ele('CodigoPais', cliente.pais || 'Desconocido').up()
                .ele('Correo', cliente.correo || 'Desconocido').up()
                .ele('NombreComercial', cliente.nombreComercial || 'Desconocido').up()
                .ele('CedulaJuridica', cliente.cedulaJuridica || 'Desconocido').up()
                .ele('Detalles')
                    .ele('CodigoMoneda', factura.codigoMoneda || 'Desconocido').up()
                    .ele('TipoCambio', factura.tipoCambio || '0.00').up()
                    .ele('TotalVenta', factura.totalVenta || '0.00').up()
                .up()
            .ele('Items')
                .ele('Item')
                    .ele('CodigoProducto', factura.detalles.map(d => d.codigoProducto).join(', ')).up()
                    .ele('Cantidad', factura.detalles.map(d => d.cantidad).join(', ')).up()
                    .ele('NombreProducto', factura.detalles.map(d => d.nombreProducto).join(', ')).up()
                    .ele('PrecioUnitario', factura.detalles.map(d => d.precioUnitario).join(', ')).up()
                    .ele('MontoTotal', factura.detalles.map(d => d.montoTotal).join(', ')).up()
                    .ele('SubTotal', factura.detalles.map(d => d.subTotal).join(', ')).up()
                .up()
            .end({ pretty: true });

        return xml;
    } catch (error) {
        console.error('Error generating XML:', error);
        throw error;
    }
};

const generatePDF = async (factura) => {
    return new Promise(async (resolve, reject) => {
        try {
            const cliente = await Cliente.findOne({ nombreComercial: factura.nombreComercial }).lean();

            if (!cliente) {
                return reject(new Error('Cliente no encontrado en la base de datos'));
            }

            const numeroFactura = await getNextFacturaNumber();

            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', err => reject(err));

            doc.font('Times-Roman');

            doc.fontSize(15).text(`Factura No. ${numeroFactura}`, { align: 'left' });

            if (cliente.logo && typeof cliente.logo === 'string') {
                try {
                    const logoBuffer = Buffer.from(cliente.logo, 'base64');
                    doc.image(logoBuffer, doc.page.width - 150, 30, { width: 120 });
                } catch (err) {
                    console.warn('Error al decodificar el logo:', err.message);
                }
            } else {
                console.warn('Logo no encontrado o ruta incorrecta.');
            }

            doc.moveDown().fontSize(12);
            doc.text(`Nombre Comercial: ${cliente.nombreEmpresa || 'Desconocido'}`);
            doc.text(`Correo electrónico: ${cliente.CorreoEmpresa || 'Desconocido'}`);

            doc.moveDown().lineWidth(1.0).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();

            doc.moveDown().fontSize(15).text('Detalles:', { underline: true });
            doc.moveDown().fontSize(12);

            factura.detalles.forEach((detalle, index) => {
                doc.text(`Item ${index + 1}: ${detalle.nombreProducto || 'Desconocido'}`);
                doc.text(`Cantidad: ${detalle.cantidad || '0'}`);
                doc.text(`Precio Unitario: ${detalle.precioUnitario || '0.00'}`);
                doc.text(`Monto Total: ${detalle.montoTotal || '0.00'}`);
                doc.moveDown(1);
            });

            doc.moveDown(2);
            doc.fontSize(15).text(`Total Venta: ${factura.totalVenta || '0.00'}`, { align: 'left' });

            doc.end();
        } catch (error) {
            console.error('Error generating PDF:', error);
            reject(error);
        }
    });
};

const handleRequest = async (req, res) => {
    try {
        const factura = req.body;

        const xml = await generateXML(factura);
        const pdf = await generatePDF(factura);

        res.setHeader('Content-Disposition', `attachment; filename="factura_${factura.numeroFactura}.zip"`);
        res.setHeader('Content-Type', 'application/zip');

        const zip = require('archiver')('zip');
        zip.pipe(res);

        zip.append(Buffer.from(xml, 'utf8'), { name: `factura_${factura.numeroFactura}.xml` });
        zip.append(pdf, { name: `factura_${factura.numeroFactura}.pdf` });

        zip.finalize();
    } catch (error) {
        res.status(500).send({ error: 'Error generating files' });
    }
};

module.exports = { generateXML, generatePDF, handleRequest };
