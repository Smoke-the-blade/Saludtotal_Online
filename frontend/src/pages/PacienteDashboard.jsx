import { useEffect, useState } from 'react';
import axios from '../components/axios/axios';
import { useLocation, useNavigate } from 'react-router-dom';

function PacienteDashboard() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const paciente = state?.usuario;

  const [especialidades, setEspecialidades] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [seleccionada, setSeleccionada] = useState('');
  const [medico, setMedico] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [detalles, setDetalles] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [horariosMedico, setHorariosMedico] = useState([]);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [editarTurnoId, setEditarTurnoId] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [obraSocial, setObraSocial] = useState(paciente?.obra_social || '');
  const [nuevaPassword, setNuevaPassword] = useState('');

  useEffect(() => {
    if (!paciente?.id) {
      alert('Sesión no válida. Por favor, iniciá sesión nuevamente.');
      navigate('/');
    }
  }, [paciente, navigate]);

  useEffect(() => {
    setEspecialidades([
      { id: 1, nombre: 'Clínica' },
      { id: 2, nombre: 'Pediatría' },
      { id: 3, nombre: 'Cardiología' },
      { id: 4, nombre: 'Ginecología' }
    ]);
  }, []);

  useEffect(() => {
    if (paciente?.id) {
      axios.get(`http://172.20.10.13:3001/api/pacientes/turnos/${paciente.id}`)
        .then(res => setTurnos(res.data))
        .catch(err => console.error('Error al cargar turnos:', err));
    }
  }, [paciente]);

  const handleLogout = () => {
    window.location.href = '/';
  };

  const handleEspecialidad = (e) => {
    const id = e.target.value;
    setSeleccionada(id);
    setDoctores([]);
    setMedico('');
    axios.get(`http://172.20.10.13:3001/api/admin/medicos-por-especialidad/${id}`)
      .then(res => setDoctores(res.data));
  };

  const handleMedico = (e) => {
    const id = e.target.value;
    setMedico(id);
    axios.get(`http://172.20.10.13:3001/api/doctores/horarios/${id}`)
      .then(res => setHorariosMedico(res.data));
  };

  useEffect(() => {
    if (fecha && medico) {
      axios.get(`http://172.20.10.13:3001/api/doctores/ocupados/${medico}/${fecha}`)
        .then(res => setHorasOcupadas(res.data));
    }
  }, [fecha, medico]);

  const obtenerDiaSemana = (fechaStr) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const fechaObj = new Date(fechaStr + 'T00:00:00');
    return dias[fechaObj.getDay()];
  };

  const generarBloques = (inicio, fin) => {
    const bloques = [];
    const [horaInicio, minInicio] = inicio.split(':').map(Number);
    const [horaFin, minFin] = fin.split(':').map(Number);
    let horaActual = horaInicio;
    let minActual = minInicio;

    while (horaActual < horaFin || (horaActual === horaFin && minActual < minFin)) {
      const horaFormateada = `${horaActual.toString().padStart(2, '0')}:${minActual.toString().padStart(2, '0')}`;
      bloques.push(horaFormateada);
      minActual += 30;
      if (minActual >= 60) {
        minActual -= 60;
        horaActual += 1;
      }
    }

    return bloques;
  };

  const bloquesDisponibles = () => {
    if (!fecha || horariosMedico.length === 0) return [];

    const dia = obtenerDiaSemana(fecha);
    const horariosDelDia = horariosMedico.filter(h => h.dia_semana === dia);
    let bloques = [];

    horariosDelDia.forEach(h => {
      const b = generarBloques(h.hora_inicio, h.hora_fin);
      bloques = bloques.concat(b);
    });

    return bloques.filter(b => !horasOcupadas.some(h => h.slice(0, 5) === b));
  };

  const solicitarTurno = async () => {
    setMensaje('');
    setError('');

    if (!paciente?.id) {
      setError('No se pudo identificar al paciente. Iniciá sesión nuevamente.');
      return;
    }

    if (!hora) {
      setError('Seleccioná una hora disponible.');
      return;
    }

    try {
      await axios.post('http://172.20.10.13:3001/api/pacientes/solicitar-turno', {
        paciente_id: paciente.id,
        medico_id: medico,
        especialidad_id: seleccionada,
        fecha,
        hora,
        detalles
      });

      setMensaje('Turno solicitado correctamente.');
      setHora('');
      setDetalles('');

      const ocupadas = await axios.get(`http://172.20.10.13:3001/api/doctores/ocupados/${medico}/${fecha}`);
      setHorasOcupadas(ocupadas.data);

      const turnosActualizados = await axios.get(`http://172.20.10.13:3001/api/pacientes/turnos/${paciente.id}`);
      setTurnos(turnosActualizados.data);

      setTimeout(() => setMensaje(''), 3000);

    } catch (err) {
      console.error('❌ Error al solicitar el turno:', err);
      setError(`No se pudo solicitar el turno. ${err.response?.data?.mensaje || err.message}`);
    }
  };

  const cancelarTurno = async (id) => {
    try {
      await axios.patch(`http://172.20.10.13:3001/api/pacientes/turno/cancelar/${id}`);
      setTurnos(prev => prev.map(t => t.id === id ? { ...t, estado: 'cancelado' } : t));
      setMensaje('Turno cancelado correctamente.');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error('Error al cancelar turno:', err);
      setError('No se pudo cancelar el turno.');
    }
  };

  const guardarCambiosTurno = async (id) => {
    if (!nuevaFecha || !nuevaHora) {
      setError('Debés completar nueva fecha y hora.');
      return;
    }

    try {
      await axios.put(`http://172.20.10.13:3001/api/pacientes/turno/${id}`, {
        nuevaFecha,
        nuevaHora
      });

      setTurnos(prev => prev.map(t =>
        t.id === id ? { ...t, fecha: nuevaFecha, hora: nuevaHora } : t
      ));
      setEditarTurnoId(null);
      setNuevaFecha('');
      setNuevaHora('');
      setMensaje('Turno modificado correctamente.');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error('Error al modificar turno:', err);
      setError('No se pudo modificar el turno.');
    }
  };

  const actualizarPerfil = async (tipo) => {
    setMensaje('');
    setError('');

    const payload = {};
    if (tipo === 'obra_social' && obraSocial.trim()) {
      payload.obra_social = obraSocial;
    } else if (tipo === 'password' && nuevaPassword.trim()) {
      payload.nueva_contrasena = nuevaPassword;
    } else {
      setError('Ingresá un valor válido.');
      return;
    }

    try {
      await axios.put(`http://172.20.10.13:3001/api/pacientes/actualizar/${paciente.id}`, payload);
      setMensaje(`${tipo === 'obra_social' ? 'Obra social' : 'Contraseña'} actualizada correctamente.`);

      if (tipo === 'password') setNuevaPassword('');
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setError('No se pudo actualizar el perfil.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="container">
      <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <h2>Bienvenido/a, {paciente?.nombre}</h2>

      {/* Turno nuevo */}
      <label>Especialidad:</label>
      <select value={seleccionada} onChange={handleEspecialidad}>
        <option value="">Seleccionar</option>
        {especialidades.map(esp => (
          <option key={esp.id} value={esp.id}>{esp.nombre}</option>
        ))}
      </select>

      <label>Médico:</label>
      <select value={medico} onChange={handleMedico}>
        <option value="">Seleccionar</option>
        {doctores.map(doc => (
          <option key={doc.id} value={doc.id}>{doc.nombre} {doc.apellido}</option>
        ))}
      </select>

      <label>Fecha:</label>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

      <label>Hora disponible:</label>
      <select value={hora} onChange={(e) => setHora(e.target.value)}>
        <option value="">Seleccionar</option>
        {bloquesDisponibles().map(b => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>

      <label>Detalles adicionales:</label>
      <textarea value={detalles} onChange={(e) => setDetalles(e.target.value)} rows="3" />

      <button onClick={solicitarTurno}>Solicitar Turno</button>

      <hr />

      {/* Actualizar Obra Social */}
      <h3>Actualizar Obra Social</h3>
      <label>Nueva Obra Social:</label>
      <input type="text" value={obraSocial} onChange={e => setObraSocial(e.target.value)} />
      <button onClick={() => actualizarPerfil('obra_social')}>Actualizar Obra Social</button>

      <hr />

      {/* Cambiar Contraseña */}
      <h3>Cambiar Contraseña</h3>
      <label>Nueva Contraseña:</label>
      <input type="password" value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} />
      <button onClick={() => actualizarPerfil('password')}>Actualizar Contraseña</button>

      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Mis Turnos</h3>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Estado</th>
            <th>Médico</th>
            <th>Especialidad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {turnos.map(turno => (
            <tr key={turno.id}>
              <td>
                {editarTurnoId === turno.id ? (
                  <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} />
                ) : turno.fecha}
              </td>
              <td>
                {editarTurnoId === turno.id ? (
                  <input type="time" value={nuevaHora} onChange={e => setNuevaHora(e.target.value)} />
                ) : turno.hora}
              </td>
              <td>{turno.estado}</td>
              <td>{turno.nombre_medico} {turno.apellido_medico}</td>
              <td>{turno.especialidad}</td>
              <td>
                {turno.estado?.toLowerCase().trim() === 'en espera' && (
                  editarTurnoId === turno.id ? (
                    <>
                      <button onClick={() => guardarCambiosTurno(turno.id)}>Guardar</button>
                      <button onClick={() => setEditarTurnoId(null)}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => {
                        setEditarTurnoId(turno.id);
                        setNuevaFecha(turno.fecha);
                        setNuevaHora(turno.hora);
                      }}>Modificar</button>
                      <button onClick={() => cancelarTurno(turno.id)}>Cancelar turno</button>
                    </>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PacienteDashboard;
