import { useEffect, useState } from 'react';
import axios from '../components/axios/axios';
import { useLocation } from 'react-router-dom';

function DoctorDashboard() {
  const { state } = useLocation();
  const doctor = state?.usuario;

  const [turnos, setTurnos] = useState([]);
  const [todosLosTurnos, setTodosLosTurnos] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [mensajeContrasena, setMensajeContrasena] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [nuevoHorario, setNuevoHorario] = useState({ dia_semana: '', hora_inicio: '', hora_fin: '' });
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [formulario, setFormulario] = useState('Nombre:\nEdad:\nPeso:\nAltura:\nMotivo de consulta:\nTratamiento:');
  const [mensajeFormulario, setMensajeFormulario] = useState('');
  const [formularios, setFormularios] = useState([]);
  const [editarFormularioId, setEditarFormularioId] = useState(null);
  const [formularioEditado, setFormularioEditado] = useState('');
  const [formulariosDelDoctor, setFormulariosDelDoctor] = useState([]);

  useEffect(() => {
    if (!doctor) return;

    axios.get(`http://172.20.10.13:3001/api/doctores/turnos/${doctor.id}`)
      .then((res) => {
        setTodosLosTurnos(res.data);
        const hoy = new Date().toISOString().split('T')[0];
        setTurnos(res.data.filter(turno => new Date(turno.fecha).toISOString().split('T')[0] === hoy));
      })
      .catch(() => setError('Error al cargar los turnos.'));

    axios.get(`http://172.20.10.13:3001/api/doctores/horarios/${doctor.id}`)
      .then((res) => setHorarios(res.data))
      .catch(() => console.error('Error al obtener horarios.'));
  }, [doctor]);

  const handleLogout = () => {
    window.location.href = '/';
  };

  const cambiarEstado = async (turnoId, nuevoEstado) => {
    setMensaje('');
    setError('');

    try {
      await axios.put(`http://172.20.10.13:3001/api/doctores/turnos/${turnoId}`, { estado: nuevoEstado });
      setMensaje('Estado actualizado.');

      const res = await axios.get(`http://172.20.10.13:3001/api/doctores/turnos/${doctor.id}`);
      setTodosLosTurnos(res.data);
      setTurnos(res.data.filter(turno => new Date(turno.fecha).toISOString().split('T')[0] === filtroFecha));
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar el estado.');
    }
  };

  const cambiarContrasena = async () => {
    setMensajeContrasena('');

    if (!nuevaContrasena) {
      setMensajeContrasena('La nueva contraseña no puede estar vacía.');
      return;
    }

    try {
      await axios.put(`http://172.20.10.13:3001/api/doctores/cambiar-contrasena/${doctor.id}`, {
        nueva_contrasena: nuevaContrasena,
      });
      setMensajeContrasena('Contraseña actualizada correctamente.');
      setNuevaContrasena('');
    } catch (err) {
      console.error(err);
      setMensajeContrasena('Error al actualizar la contraseña.');
    }
  };

  const cambiarFecha = (e) => {
    const fechaSeleccionada = e.target.value;
    setFiltroFecha(fechaSeleccionada);
    const filtrados = todosLosTurnos.filter(turno => new Date(turno.fecha).toISOString().split('T')[0] === fechaSeleccionada);
    setTurnos(filtrados);
  };

  const formatearHora = (hora) => hora.length === 5 ? `${hora}:00` : hora;

  const actualizarHorario = (campo, valor) => {
    setNuevoHorario(prev => ({
      ...prev,
      [campo]: campo.includes('hora') ? formatearHora(valor) : valor
    }));
  };

  const eliminarHorario = (index) => {
    const nuevos = horarios.filter((_, i) => i !== index);
    setHorarios(nuevos);

    axios.put(`http://172.20.10.13:3001/api/doctores/actualizar-horarios/${doctor.id}`, { horarios: nuevos })
      .then(() => setMensaje('Horario eliminado correctamente.'))
      .catch(() => setError('Error al eliminar horario.'));
  };

  const guardarHorarios = async () => {
    try {
      const nuevos = [...horarios, nuevoHorario];
      await axios.put(`http://172.20.10.13:3001/api/doctores/actualizar-horarios/${doctor.id}`, { horarios: nuevos });
      setHorarios(nuevos);
      setNuevoHorario({ dia_semana: '', hora_inicio: '', hora_fin: '' });
      setMensaje('Horario actualizado correctamente.');
    } catch (err) {
      console.error('Error al actualizar los horarios.');
      setError('Error al actualizar los horarios.');
    }
  };

  const enviarFormulario = async () => {
    if (!nombrePaciente.trim().includes(' ')) {
      setMensajeFormulario('Debe ingresar nombre y apellido del paciente.');
      return;
    }

    try {
      const res = await axios.post('http://172.20.10.13:3001/api/doctores/formulario', {
        doctor_id: doctor.id,
        nombre_completo: nombrePaciente.trim(),
        contenido: formulario
      });
      setMensajeFormulario(res.data.mensaje || 'Formulario enviado.');
      setNombrePaciente('');
      setFormulario('Nombre:\nEdad:\nPeso:\nAltura:\nMotivo de consulta:\nTratamiento:');
    } catch (err) {
      console.error(err);
      setMensajeFormulario('Error al enviar el formulario.');
    }
  };

  const buscarFormularios = async () => {
    if (!nombrePaciente.trim().includes(' ')) {
      setMensajeFormulario('Debe ingresar nombre y apellido del paciente.');
      return;
    }

    try {
      const res = await axios.get(`http://172.20.10.13:3001/api/doctores/formularios-nombre/${encodeURIComponent(nombrePaciente.trim())}`);
      setFormularios(res.data);
      if (res.data.length === 0) setMensajeFormulario('No se encontraron formularios.');
      else setMensajeFormulario('');
    } catch (err) {
      console.error(err);
      setMensajeFormulario('Error al buscar formularios.');
    }
  };

  const obtenerFormulariosDelDoctor = async () => {
    try {
      const res = await axios.get(`http://172.20.10.13:3001/api/doctores/formularios/${doctor.id}`);
      setFormulariosDelDoctor(res.data);
      setMensajeFormulario('');
    } catch (err) {
      console.error(err);
      setMensajeFormulario('Error al obtener formularios del doctor.');
    }
  };

  const guardarEdicionFormulario = async () => {
    try {
      const fecha = new Date().toLocaleDateString('es-AR');

      const motivo = formularioEditado.match(/Motivo de consulta:(.*?)\n/);
      const tratamiento = formularioEditado.match(/Tratamiento:(.*?)(\n|$)/);

      const nuevoMotivo = prompt('Nuevo motivo de consulta:');
      const nuevoTratamiento = prompt('Nuevo tratamiento:');

      const nuevaEntrada = `Motivo de consulta: ${nuevoMotivo}\nTratamiento: ${nuevoTratamiento}\nFecha: ${fecha}`;

      const nuevoContenido = `${formularioEditado}\n${nuevaEntrada}`;

      await axios.put(`http://172.20.10.13:3001/api/doctores/formulario/${editarFormularioId}`, {
        contenido: nuevoContenido
      });
      setEditarFormularioId(null);
      setFormularioEditado('');
      buscarFormularios();
    } catch (err) {
      console.error(err);
      alert('Error al editar el formulario.');
    }
  };
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <h2>Panel del Doctor/a {doctor?.nombre} {doctor?.apellido}</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>Filtrar por fecha: </label>
        <input type="date" value={filtroFecha} onChange={cambiarFecha} />
      </div>

      {turnos.map((turno) => (
        <div key={turno.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <p><strong>Paciente:</strong> {turno.paciente_nombre} {turno.paciente_apellido}</p>
          <p><strong>Obra Social:</strong> {turno.obra_social || 'No especificada'}</p>
          <p><strong>Fecha:</strong> {new Date(turno.fecha).toLocaleDateString('es-AR')}</p>
          <p><strong>Hora:</strong> {turno.hora}</p>
          <p><strong>Estado:</strong> {turno.estado}</p>
          <p><strong>Detalles:</strong> {turno.detalles || 'Sin detalles'}</p>

          <select value={turno.estado} onChange={(e) => cambiarEstado(turno.id, e.target.value)}>
            <option value="en espera">En Espera</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
            <option value="atendido">Atendido</option>
          </select>
        </div>
      ))}

      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <hr />
      <h3>Cambiar contraseña</h3>
      <input type="password" placeholder="Nueva contraseña" value={nuevaContrasena} onChange={(e) => setNuevaContrasena(e.target.value)} />
      <button onClick={cambiarContrasena}>Actualizar contraseña</button>
      {mensajeContrasena && <p>{mensajeContrasena}</p>}

      <hr />
      <h3>Actualizar Horarios de Atención</h3>
      {horarios.map((h, i) => (
        <div key={i}>
          {h.dia_semana} de {h.hora_inicio} a {h.hora_fin}
          <button onClick={() => eliminarHorario(i)} style={{ marginLeft: '1rem' }}>Eliminar</button>
        </div>
      ))}
      <div>
        <select value={nuevoHorario.dia_semana} onChange={(e) => actualizarHorario('dia_semana', e.target.value)}>
          <option value=''>Día</option>
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input type="time" value={nuevoHorario.hora_inicio} onChange={(e) => actualizarHorario('hora_inicio', e.target.value)} />
        <input type="time" value={nuevoHorario.hora_fin} onChange={(e) => actualizarHorario('hora_fin', e.target.value)} />
        <button onClick={guardarHorarios}>Agregar Horario</button>
      </div>

      <hr />
      <h3>Crear Formulario Médico</h3>
      <input type="text" placeholder="Nombre completo del paciente" value={nombrePaciente} onChange={(e) => setNombrePaciente(e.target.value)} />
      <br />
      <textarea rows={10} cols={50} value={formulario} onChange={(e) => setFormulario(e.target.value)} />
      <br />
      <button onClick={enviarFormulario}>Enviar Formulario</button>
      {mensajeFormulario && <p>{mensajeFormulario}</p>}

      <hr />
      <h3>Ver Formularios de Paciente</h3>
      <button onClick={buscarFormularios}>Buscar formularios por nombre</button>

      {formularios && formularios.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Formularios encontrados:</h4>
          {formularios.map((f) => (
            <div key={f.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
              <p><strong>Fecha:</strong> {new Date(f.fecha_creacion || f.fecha).toLocaleString('es-AR')}</p>
              {editarFormularioId === f.id ? (
                <>
                  <textarea value={formularioEditado} onChange={(e) => setFormularioEditado(e.target.value)} rows={8} cols={50} />
                  <br />
                  <button onClick={guardarEdicionFormulario}>Guardar</button>
                  <button onClick={() => setEditarFormularioId(null)}>Cancelar</button>
                </>
              ) : (
                <>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{f.contenido}</pre>
                  <button onClick={() => { setEditarFormularioId(f.id); setFormularioEditado(f.contenido); }}>Editar</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <hr />
      <h3>Ver Todos Mis Formularios</h3>
      <button onClick={obtenerFormulariosDelDoctor}>Mostrar Formularios Creados</button>

      {formulariosDelDoctor.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Mis Formularios:</h4>
          {formulariosDelDoctor.map((f) => (
            <div key={f.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
              <p><strong>Paciente:</strong> {f.nombre_completo}</p>
              <p><strong>Fecha:</strong> {new Date(f.fecha).toLocaleString('es-AR')}</p>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{f.contenido}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
