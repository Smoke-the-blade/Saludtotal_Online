const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/pacientes', require('./routes/pacienteRoutes'));
app.use('/api/doctores', require('./routes/doctorRoutes'));
app.use('/api/turnos', require('./routes/turnoRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/prueba', (req, res) => {
  res.json({ mensaje: 'El backend responde correctamente desde la red local' });
});


const PORT = 3001;
app.listen(PORT, '0.0.0.0',() => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


