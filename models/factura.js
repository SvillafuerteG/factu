const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema({
    cliente: { type: String, required: true }, // Cambiado a String para almacenar el nombre de la empresa
    detalles: [{
        numeroLinea: Number,
        codigoProducto: String,
        cantidad: Number,
        nombreProducto: String,
        precioUnitario: Number,
        montoTotal: Number,
        subTotal: Number
    }],
    totalVenta: Number,
});

const Factura = mongoose.model('Factura', facturaSchema);

module.exports = Factura;

