const multer = require('multer');
const path = require('path');

// Configuración de multer para almacenar la imagen en la memoria
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: ¡Solo se permiten imágenes!'); // Rechaza archivos que no sean imágenes
        }
    }
});

module.exports = upload;
