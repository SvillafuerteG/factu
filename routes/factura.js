const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');
const { Cliente, Factura } = require('../models');
const { generateXML, generatePDF, requestTributacionAPI } = require('../fileGenerators/file');

router.post('/', async (req, res) => {
    try {
        const clienteNombre = req.body.cliente;

        if (!clienteNombre) {
            return res.status(400).send({ error: 'clienten no proporcionado en el cuerpo de la solicitud.' });
        }

        const cliente = await Cliente.findOne({ nombreEmpresa: new RegExp('^' + clienteNombre + '$', 'i') });

        if (!cliente) {
            return res.status(404).send({ error: 'Cliente no encontrado. No se puede crear la factura.' });
        }

        // Resto de tu lógica...
    


        // Crear una nueva factura
        const factura = new Factura(req.body);
        await factura.save();

        // Generar XML y PDF
        const xml = await generateXML(req.body);
        const pdf = await generatePDF(req.body);
        /*const xmlRespuesta = await requestTributacionAPI(xml);*/ 

        // Enviar la respuesta como un archivo ZIP
        res.setHeader('Content-Disposition', 'attachment; filename="factura.zip"');
        res.setHeader('Content-Type', 'application/zip');

        const zip = require('archiver')('zip');
        zip.pipe(res);

        zip.append(Buffer.from(xml, 'utf8'), { name: `factura_${factura._id}.xml` });
      /*  zip.append(Buffer.from(xmlRespuesta, 'utf8'), { name: `respuesta_${factura._id}.xml` });*/
        zip.append(pdf, { name: `factura_${factura._id}.pdf` });

        zip.finalize();
    } catch (error) {
        console.error('Error en la creación de la factura:', error);
        res.status(400).send({ error: 'Error en la creación de la factura', details: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const facturas = await Factura.find().populate('clienteId');
        res.status(200).send(facturas);
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener las facturas', details: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const factura = await Factura.findById(req.params.id).populate('clienteId');
        if (!factura) {
            return res.status(404).send({ error: 'Factura no encontrada' });
        }
        res.status(200).send(factura);
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener la factura', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const factura = await Factura.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!factura) {
            return res.status(404).send({ error: 'Factura no encontrada' });
        }
        res.status(200).send(factura);
    } catch (error) {
        res.status(400).send({ error: 'Error al actualizar la factura', details: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const factura = await Factura.findByIdAndDelete(req.params.id);
        if (!factura) {
            return res.status(404).send({ error: 'Factura no encontrada' });
        }

        res.status(200).send(factura);
    } catch (error) {
        res.status(500).send({ error: 'Error al eliminar la factura', details: error.message });
    }
});

module.exports = router;
