const db = require('../models/db');

// 1. Médicos por especialidad
exports.listarMedicosPorEspecialidad = (req, res) => {
  const especialidadId = req.params.especialidadId;

  const sql = `
    SELECT u.id, u.nombre, u.apellido, u.email
    FROM usuarios u
    JOIN medico_especialidades me ON u.id = me.medico_id
    WHERE me.especialidad_id = ? AND u.tipo = 'medico'
  `;

  db.query(sql, [especialidadId], (err, resultados) => {
    if (err) return res.status(500).json({ mensaje: 'Error al listar médicos.' });
    res.status(200).json(resultados);
  });
};

// 2. Contar pacientes atendidos (filtrable por fecha)
exports.contarPacientesAtendidos = (req, res) => {
  const doctorId = req.params.doctorId;
  const { desde, hasta } = req.query;

  let sql = `
    SELECT COUNT(*) AS cantidad
    FROM turnos
    WHERE medico_id = ? AND estado = 'atendido'
  `;
  const params = [doctorId];

  if (desde && hasta) {
    sql += ' AND fecha BETWEEN ? AND ?';
    params.push(desde, hasta);
  }

  db.query(sql, params, (err, resultados) => {
    if (err) return res.status(500).json({ mensaje: 'Error al contar pacientes.' });
    res.status(200).json(resultados[0]);
  });
};

// 3. Registrar médico
exports.registrarMedico = (req, res) => {
  const { nombre, apellido, email, contrasena, especialidades, horarios } = req.body;

  const sqlUsuario = `
    INSERT INTO usuarios (nombre, apellido, email, contrasena, tipo)
    VALUES (?, ?, ?, ?, 'medico')
  `;

  db.query(sqlUsuario, [nombre, apellido, email, contrasena], (err, resultado) => {
    if (err) return res.status(500).json({ mensaje: 'Error al registrar médico.' });

    const medicoId = resultado.insertId;

    const sqlEspecialidad = `INSERT INTO medico_especialidades (medico_id, especialidad_id) VALUES ?`;
    const valoresEspecialidad = especialidades.map(id => [medicoId, id]);

    db.query(sqlEspecialidad, [valoresEspecialidad], (err) => {
      if (err) return res.status(500).json({ mensaje: 'Error al asignar especialidades.' });

      const sqlHorario = `INSERT INTO horarios_doctores (doctor_id, dia_semana, hora_inicio, hora_fin) VALUES ?`;
      const valoresHorarios = horarios.map(h => [medicoId, h.dia_semana, h.hora_inicio, h.hora_fin]);

      db.query(sqlHorario, [valoresHorarios], (err) => {
        if (err) return res.status(500).json({ mensaje: 'Error al registrar horarios.' });
        res.status(201).json({ mensaje: 'Médico registrado correctamente.' });
      });
    });
  });
};

// 4. Listar formularios por nombre paciente o doctor_id
exports.obtenerFormularios = (req, res) => {
  const { nombre_completo, doctor_id } = req.query;
  let sql = 'SELECT * FROM formularios_medicos WHERE 1=1';
  const params = [];

  if (nombre_completo) {
    sql += ' AND nombre_completo LIKE ?';
    params.push(`%${nombre_completo}%`);
  }

  if (doctor_id) {
    sql += ' AND doctor_id = ?';
    params.push(doctor_id);
  }

  db.query(sql, params, (err, resultados) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener formularios.' });
    res.status(200).json(resultados);
  });
};

// 5. Registrar nuevo administrador (opcional)
exports.crearAdministrador = (req, res) => {
  const { nombre, apellido, email, contrasena } = req.body;

  const sql = `
    INSERT INTO usuarios (nombre, apellido, email, contrasena, tipo)
    VALUES (?, ?, ?, ?, 'admin')
  `;

  db.query(sql, [nombre, apellido, email, contrasena], (err) => {
    if (err) return res.status(500).json({ mensaje: 'Error al registrar administrador.' });
    res.status(201).json({ mensaje: 'Administrador creado correctamente.' });
  });
};


exports.verFormulariosConDoctor = (req, res) => {
  const { nombre_completo, doctor_id } = req.query;

  let sql = `
    SELECT 
      f.id, f.nombre_completo, f.fecha, f.contenido, 
      u.nombre AS doctor_nombre, u.apellido AS doctor_apellido 
    FROM formularios_medicos f 
    JOIN usuarios u ON f.doctor_id = u.id 
    WHERE 1 = 1
  `;

  const params = [];

  if (nombre_completo) {
    sql += ' AND f.nombre_completo LIKE ?';
    params.push(`%${nombre_completo}%`);
  }

  if (doctor_id) {
    sql += ' AND f.doctor_id = ?';
    params.push(doctor_id);
  }

  db.query(sql, params, (err, resultados) => {
    if (err) {
      console.error('Error al obtener formularios:', err);
      return res.status(500).json({ mensaje: 'Error al obtener los formularios' });
    }

    res.status(200).json(resultados);
  });
};

exports.listarPacientes = (req, res) => {
  const sql = `SELECT id, nombre, apellido, email, obra_social FROM usuarios WHERE tipo = 'paciente'`;

  db.query(sql, (err, resultados) => {
    if (err) {
      console.error('Error al obtener pacientes:', err);
      return res.status(500).json({ mensaje: 'Error al obtener pacientes' });
    }
    res.status(200).json(resultados);
  });
};
