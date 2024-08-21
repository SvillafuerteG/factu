const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // 'key' se usa para identificar el contador (ej. 'factura')
    seq: { type: Number, default: 0 } // 'seq' almacena el valor de la secuencia
});

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
