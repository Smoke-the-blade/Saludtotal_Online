const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// Gestión de turnos
router.get('/turnos/:doctorId', doctorController.verTurnos);
router.put('/turnos/:turnoId', doctorController.actualizarEstadoTurno);
router.get('/ocupados/:medicoId/:fecha', doctorController.horasOcupadas);

// Formularios médicos
router.post('/formulario', doctorController.crearFormularioMedico);
router.get('/formularios-nombre/:nombreCompleto', doctorController.obtenerFormulariosPorNombre);
router.put('/formulario/:id', doctorController.editarFormularioMedico);

// Horarios del doctor
router.get('/horarios/:doctorId', doctorController.obtenerHorariosDoctor);
router.put('/actualizar-horarios/:doctorId', doctorController.actualizarHorariosDoctor);

// Cambiar contraseña
router.put('/cambiar-contrasena/:doctorId', doctorController.cambiarPassword);

// Buscar paciente
router.get('/buscar-paciente', doctorController.buscarPacientePorNombreCompleto);
router.get('/formularios/:id', doctorController.listarFormulariosDelDoctor);


module.exports = router;
