const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const clienteRouter = require('./routes/cliente');
const facturaRouter = require('./routes/factura');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conectar a la base de datos
mongoose.connect('mongodb://localhost:27017/facturaDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Configurar las rutas
app.use('/cliente', clienteRouter);
app.use('/factura', facturaRouter);

// Manejo de errores 404
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
