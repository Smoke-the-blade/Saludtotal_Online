const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/medicos-por-especialidad/:especialidadId', adminController.listarMedicosPorEspecialidad);
router.get('/pacientes-atendidos/:doctorId', adminController.contarPacientesAtendidos);
router.post('/registrar-medico', adminController.registrarMedico);
router.post('/crear-admin', adminController.crearAdministrador);

router.get('/formularios', adminController.verFormulariosConDoctor);
router.get('/pacientes', adminController.listarPacientes);

module.exports = router;
