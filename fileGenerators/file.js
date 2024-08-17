const fs = require('fs-extra');
const PDFDocument = require('pdfkit');
const xmlbuilder = require('xmlbuilder');
const path = require('path');
const mongoose = require('mongoose');

// Asume que tienes un modelo Cliente definido en Mongoose
const Cliente = require('../models/cliente'); // Ajusta la ruta según sea necesario

const generateXML = async (factura) => {
    try {
        const cliente = await Cliente.findOne({ nombreComercial: factura.nombreComercial }).lean();

        if (!cliente) {
            throw new Error('Cliente no encontrado en la base de datos');
        }

        const xml = xmlbuilder.create('Factura')
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

            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', err => reject(err));

            doc.font('Times-Roman');

            doc.fontSize(15).text('Factura', { align: 'left' });

            // Decodifica el logo si está presente y es una cadena
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

            // Nombre Comercial y Correo Electrónico espaciados
            doc.text(`Nombre Comercial: ${cliente.nombreEmpresa || 'Desconocido'}`);
            doc.text(`Correo electrónico: ${cliente.CorreoEmpresa || 'Desconocido'}`);

            doc.moveDown().lineWidth(1.0).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();

            doc.moveDown().fontSize(15).text('Detalles:', { underline: true });
            doc.moveDown().fontSize(12);

            // Alineación de los detalles al lado izquierdo
            factura.detalles.forEach((detalle, index) => {
                doc.text(`Item ${index + 1}: ${detalle.nombreProducto || 'Desconocido'}`);
                doc.text(`Cantidad: ${detalle.cantidad || '0'}`);
                doc.text(`Precio Unitario: ${detalle.precioUnitario || '0.00'}`);
                doc.text(`Monto Total: ${detalle.montoTotal || '0.00'}`);
                doc.moveDown(1);
            });

            doc.moveDown(2); // Espacio antes del total

            // Añadir el total al final, alineado a la izquierda
            doc.fontSize(15).text(`Total Venta: ${factura.totalVenta || '0.00'}`, { align: 'left' });

            // Finaliza el documento correctamente
            doc.end();
        } catch (error) {
            console.error('Error generating PDF:', error);
            reject(error);
        }
    });
};




const axios = require('axios');

/*const requestTributacionAPI = async (xml) => {
    try {
        const response = await axios.post('URL_DE_LA_API_DE_TRIBUTACION', xml, {
            headers: {
                'Content-Type': 'application/xml'
            }
        });

        const xmlRespuesta = response.data;
        return xmlRespuesta;
    } catch (error) {
        console.error('Error requesting Tributacion API:', error);
        throw error;
    }
};*/
const handleRequest = async (req, res) => {
    try {
        const factura = req.body;

        const xml = await generateXML(factura);
        const pdf = await generatePDF(factura);
        // const xmlRespuesta = await requestTributacionAPI(xml);

        res.setHeader('Content-Disposition', 'attachment; filename="factura.zip"');
        res.setHeader('Content-Type', 'application/zip');

        const zip = require('archiver')('zip');
        zip.pipe(res);

        zip.append(Buffer.from(xml, 'utf8'), { name: 'factura.xml' });
        // zip.append(Buffer.from(xmlRespuesta, 'utf8'), { name: 'respuesta.xml' });
        zip.append(pdf, { name: 'factura.pdf' });

        zip.finalize();
    } catch (error) {
        res.status(500).send({ error: 'Error generating files' });
    }
};




module.exports = { generateXML, generatePDF, /*requestTributacionAPI*/ handleRequest };

