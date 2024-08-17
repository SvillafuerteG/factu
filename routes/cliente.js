const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const multer = require('multer');
const path = require('path');
const Cliente = require('../models/cliente');

// Configura multer para manejar la carga de archivos
const storage = multer.memoryStorage(); // Almacenará el archivo en memoria temporalmente
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limitar el tamaño del archivo a 5 MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Tipo de archivo no permitido. Sólo se permiten imágenes JPEG y PNG.'));
        }
        cb(null, true);
    }
});

router.post('/', upload.single('logo'), async (req, res) => {
    try {
        // Validación de los campos requeridos
        const { nombreEmpresa, CorreoEmpresa, tipoVenta, pais, cedulaJuridica, tipoIdentificacion } = req.body;

        // Verifica si el archivo ha sido cargado
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }

        // Crear un nuevo cliente
        const cliente = new Cliente({
            ...req.body,
            logo: {
                data: req.file.buffer,
                contentType: req.file.mimetype
            }
        });

        await cliente.save();

        // Crear una carpeta para el cliente
        const clienteDir = path.join('./facturas', cliente.nombreEmpresa);
        await fs.ensureDir(clienteDir);

        res.status(201).json(cliente);
    } catch (error) {
        // Enviar el error como respuesta
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;


