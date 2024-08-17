const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
    
    nombreEmpresa: { type: String, required: true },
    CorreoEmpresa: { type: String, required: true },
    tipoVenta: { type: String, required: true },
    pais: { type: String, required: true },
    cedulaJuridica: { type: String, required: true },
    tipoIdentificacion: { type: String, required: true },
    logo: {
        data: Buffer,
        contentType: String 
    }
});

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = Cliente;


