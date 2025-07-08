const db = require('../models/db');
const bcrypt = require('bcrypt');


exports.solicitarTurno = (req, res) => {
  const { paciente_id, medico_id, especialidad_id, fecha, hora, detalles } = req.body;

  const verificarSql = `
    SELECT * FROM turnos
    WHERE medico_id = ? AND fecha = ? AND hora = ? AND estado != 'cancelado'
  `;

  db.query(verificarSql, [medico_id, fecha, hora], (err, resultados) => {
    if (err) return res.status(500).json({ mensaje: 'Error al verificar disponibilidad.' });
    if (resultados.length > 0) {
      return res.status(409).json({ mensaje: 'Ese turno ya está reservado.' });
    }

    const insertarSql = `
      INSERT INTO turnos (paciente_id, medico_id, especialidad_id, fecha, hora, detalles)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(insertarSql, [paciente_id, medico_id, especialidad_id, fecha, hora, detalles], (err) => {
      if (err) return res.status(500).json({ mensaje: 'Error al solicitar el turno.' });
      res.status(201).json({ mensaje: 'Turno solicitado correctamente.' });
    });
  });
};
exports.obtenerTurnosPaciente = (req, res) => {
  const { pacienteId } = req.params;
  const sql = `
    SELECT 
      turnos.id, turnos.fecha, turnos.hora, turnos.estado, turnos.detalles,
      usuarios.nombre AS nombre_medico,
      usuarios.apellido AS apellido_medico,
      especialidades.nombre AS especialidad
    FROM turnos
    JOIN usuarios ON turnos.medico_id = usuarios.id
    JOIN especialidades ON turnos.especialidad_id = especialidades.id
    WHERE turnos.paciente_id = ?
    ORDER BY turnos.fecha DESC, turnos.hora ASC
  `;

  db.query(sql, [pacienteId], (err, resultados) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener los turnos.' });
    res.status(200).json(resultados);
  });
};

exports.modificarTurno = (req, res) => {
  const { id } = req.params;
  const { nuevaFecha, nuevaHora } = req.body;

  const verificarEstado = `SELECT * FROM turnos WHERE id = ? AND estado = 'en espera'`;

  db.query(verificarEstado, [id], (err, resultados) => {
    if (err) return res.status(500).json({ mensaje: 'Error al verificar el estado del turno.' });
    if (resultados.length === 0) {
      return res.status(400).json({ mensaje: 'Solo se pueden modificar turnos en espera.' });
    }

    const turno = resultados[0];

    const verificarConflicto = `
      SELECT * FROM turnos
      WHERE medico_id = ? AND fecha = ? AND hora = ? AND estado != 'cancelado' AND id != ?
    `;

    db.query(verificarConflicto, [turno.medico_id, nuevaFecha, nuevaHora, id], (err2, conflictos) => {
      if (err2) return res.status(500).json({ mensaje: 'Error al verificar disponibilidad.' });
      if (conflictos.length > 0) {
        return res.status(409).json({ mensaje: 'Esa fecha y hora ya está ocupada por otro turno.' });
      }

      const actualizar = `UPDATE turnos SET fecha = ?, hora = ? WHERE id = ?`;
      db.query(actualizar, [nuevaFecha, nuevaHora, id], (err3) => {
        if (err3) return res.status(500).json({ mensaje: 'Error al actualizar el turno.' });
        res.status(200).json({ mensaje: 'Turno actualizado correctamente.' });
      });
    });
  });
};

exports.cancelarTurno = (req, res) => {
  const { id } = req.params;
  const buscarSql = 'SELECT estado FROM turnos WHERE id = ?';

  db.query(buscarSql, [id], (err, resultados) => {
    if (err) return res.status(500).json({ mensaje: 'Error al buscar el turno.' });
    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: 'Turno no encontrado.' });
    }

    if (resultados[0].estado !== 'en espera') {
      return res.status(400).json({ mensaje: 'Solo se pueden cancelar turnos en espera.' });
    }

    const cancelarSql = 'UPDATE turnos SET estado = "cancelado" WHERE id = ?';
    db.query(cancelarSql, [id], (err) => {
      if (err) return res.status(500).json({ mensaje: 'Error al cancelar el turno.' });
      res.status(200).json({ mensaje: 'Turno cancelado correctamente.' });
    });
  });
};

exports.actualizarDatosPaciente = async (req, res) => {
  const pacienteId = req.params.id;
  const { obra_social, nueva_contrasena } = req.body;

  const updatesUsuario = [];
  const valuesUsuario = [];

  if (obra_social) {
    updatesUsuario.push('obra_social = ?');
    valuesUsuario.push(obra_social);
  }

  if (nueva_contrasena) {
    updatesUsuario.push('contrasena = ?');
    valuesUsuario.push(nueva_contrasena);
  }

  try {
    if (updatesUsuario.length > 0) {
      const sqlUsuario = `UPDATE usuarios SET ${updatesUsuario.join(', ')} WHERE id = ?`;
      valuesUsuario.push(pacienteId);
      await db.promise().query(sqlUsuario, valuesUsuario);
    }

    res.status(200).json({ mensaje: 'Datos actualizados correctamente.' });

  } catch (err) {
    console.error('Error al actualizar:', err);
    res.status(500).json({ mensaje: 'Error al actualizar los datos.' });
  }
};

exports.cambiarContrasena = (req, res) => {
  const pacienteId = req.params.id;
  const { nueva_contrasena } = req.body;

  if (!nueva_contrasena) {
    return res.status(400).json({ mensaje: 'Debes ingresar una nueva contraseña.' });
  }

  const sql = `UPDATE usuarios SET contrasena = ? WHERE id = ? AND tipo = 'paciente'`;

  db.query(sql, [nueva_contrasena, pacienteId], (err) => {
    if (err) {
      console.error('Error al cambiar contraseña del paciente:', err);
      return res.status(500).json({ mensaje: 'Error al cambiar la contraseña.' });
    }

    res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
  });
};
