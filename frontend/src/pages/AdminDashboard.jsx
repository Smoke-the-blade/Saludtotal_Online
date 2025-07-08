import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../components/axios/axios';

export default function AdminDashboard() {
  const { state } = useLocation();
  const admin = state?.usuario;

  /* ────────── 1. Pacientes ────────── */
  const [pacientes, setPacientes] = useState([]);
  const [errorPacientes, setErrorPacientes] = useState('');

  /* ────────── 2. Registro de médicos ────────── */
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [especialidades, setEspecialidades] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [mensajeRegistro, setMensajeRegistro] = useState('');

  /* ────────── 3. Médicos por especialidad + KPI ────────── */
  const [especialidadId, setEspecialidadId] = useState('');
  const [medicos, setMedicos] = useState([]);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pacientesAtendidos, setPacientesAtendidos] = useState(null);

  /* ────────── 4. Formularios médicos ────────── */
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroDoctorId, setFiltroDoctorId] = useState('');
  const [formularios, setFormularios] = useState([]);

  /* ────────── 5. Agendar turno manual ────────── */
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState('');
  const [espTurno, setEspTurno] = useState('');
  const [doctorTurno, setDoctorTurno] = useState('');
  const [doctoresLista, setDoctoresLista] = useState([]);
  const [fechaTurno, setFechaTurno] = useState('');
  const [horaTurno, setHoraTurno] = useState('');
  const [detalles, setDetalles] = useState('');
  const [horariosDoctor, setHorariosDoctor] = useState([]);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [msgTurno, setMsgTurno] = useState('');
  const [errTurno, setErrTurno] = useState('');

  /* ────────── Carga inicial ────────── */
  useEffect(() => {
    cargarPacientes();
    setEspecialidades([
      { id: 1, nombre: 'Clínica' },
      { id: 2, nombre: 'Pediatría' },
      { id: 3, nombre: 'Cardiología' },
      { id: 4, nombre: 'Ginecología' }
    ]);
  }, []);

  const cargarPacientes = async () => {
    try {
      const { data } = await axios.get('/api/admin/pacientes');
      setPacientes(data);
    } catch (err) {
      console.error(err);
      setErrorPacientes('No se pudieron cargar los pacientes.');
    }
  };

  /* ────────── Helpers para horarios ────────── */
  const obtenerDiaSemana = (fechaStr) => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias[new Date(fechaStr + 'T00:00:00').getDay()];
  };

  const generarBloques = (inicio, fin) => {
    const bloques = [];
    let [h, m] = inicio.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    while (h < hf || (h === hf && m < mf)) {
      bloques.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      m += 30;
      if (m >= 60) { m -= 60; h += 1; }
    }
    return bloques;
  };

  const bloquesDisponibles = () => {
    if (!fechaTurno || horariosDoctor.length === 0) return [];
    const dia = obtenerDiaSemana(fechaTurno);
    const posibles = horariosDoctor
      .filter(h => h.dia_semana.startsWith(dia))
      .flatMap(h => generarBloques(h.hora_inicio, h.hora_fin));
    return posibles.filter(b => !horasOcupadas.some(o => o.slice(0, 5) === b));
  };

  /* ────────── Registro de médico ────────── */
  const toggleEspecialidad = (id) =>
    setSeleccionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const agregarHorario = () =>
    setHorarios(prev => [...prev, { dia_semana: '', hora_inicio: '', hora_fin: '' }]);

  const actualizarHorario = (i, campo, val) =>
    setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, [campo]: val } : h));

  const registrarMedico = async () => {
    try {
      const { data } = await axios.post('/api/admin/registrar-medico', {
        nombre, apellido, email, contrasena,
        especialidades: seleccionadas, horarios
      });
      setMensajeRegistro(data.mensaje);
      setNombre(''); setApellido(''); setEmail(''); setContrasena('');
      setSeleccionadas([]); setHorarios([]);
    } catch (err) {
      console.error(err);
      setMensajeRegistro('Error al registrar médico.');
    }
  };

  /* ────────── Médicos por especialidad ────────── */
  const buscarMedicosPorEspecialidad = async () => {
    if (!especialidadId) return;
    const { data } = await axios.get(`/api/admin/medicos-por-especialidad/${especialidadId}`);
    setMedicos(data);
  };

  const obtenerCantidadAtendidos = async (id) => {
    const { data } = await axios.get(`/api/admin/pacientes-atendidos/${id}?desde=${desde}&hasta=${hasta}`);
    setPacientesAtendidos({ id, cantidad: data.cantidad });
  };

  /* ────────── Formularios ────────── */
  const buscarFormularios = async () => {
    const { data } = await axios.get('/api/admin/formularios', {
      params: { nombre_completo: filtroNombre, doctor_id: filtroDoctorId }
    });
    setFormularios(data);
  };

  /* ────────── Turnos (select dinámico de doctor + horas) ────────── */
  useEffect(() => {                                         // al elegir especialidad
    if (!espTurno) { setDoctoresLista([]); setDoctorTurno(''); return; }
    (async () => {
      const { data } = await axios.get(`/api/admin/medicos-por-especialidad/${espTurno}`);
      setDoctoresLista(data);
    })();
  }, [espTurno]);

  useEffect(() => {                                         // al elegir doctor
    if (!doctorTurno) { setHorariosDoctor([]); return; }
    (async () => {
      const { data } = await axios.get(`/api/doctores/horarios/${doctorTurno}`);
      setHorariosDoctor(data);
    })();
  }, [doctorTurno]);

  useEffect(() => {                                         // doctor + fecha -> horas ocupadas
    if (!doctorTurno || !fechaTurno) { setHorasOcupadas([]); return; }
    (async () => {
      const { data } = await axios.get(`/api/doctores/ocupados/${doctorTurno}/${fechaTurno}`);
      setHorasOcupadas(data);
    })();
  }, [doctorTurno, fechaTurno]);

  const solicitarTurno = async () => {
    setMsgTurno(''); setErrTurno('');
    if (!pacienteSeleccionado || !doctorTurno || !espTurno || !fechaTurno || !horaTurno) {
      setErrTurno('Completá todos los campos.');
      return;
    }
    try {
      await axios.post('/api/pacientes/solicitar-turno', {
        paciente_id: pacienteSeleccionado,
        medico_id: doctorTurno,
        especialidad_id: espTurno,
        fecha: fechaTurno,
        hora: horaTurno,
        detalles
      });
      setMsgTurno('Turno solicitado correctamente.');
      setHoraTurno(''); setDetalles('');
      // refrescar horas ocupadas
      const { data } = await axios.get(`/api/doctores/ocupados/${doctorTurno}/${fechaTurno}`);
      setHorasOcupadas(data);
      setTimeout(() => setMsgTurno(''), 3000);
    } catch (err) {
      console.error(err);
      setErrTurno('No se pudo solicitar el turno.');
    }
  };

  const handleLogout = () => window.location.href = '/';

  /* ───────────── JSX ───────────── */
  return (
    <div style={{ padding: '1.5rem', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Panel del Administrador</h1>
        <div>
          <span style={{ marginRight: '1rem' }}>{admin ? `${admin.nombre} ${admin.apellido}` : 'Admin'}</span>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      {/* 1. Pacientes */}
      <section style={{ marginTop: '1.5rem' }}>
        <h2>Pacientes registrados</h2>
        {errorPacientes && <p style={{ color: 'red' }}>{errorPacientes}</p>}
        {pacientes.length ? (
          <table border="1" cellPadding="6" style={{ width: '100%' }}>
            <thead><tr><th>ID</th><th>Nombre</th><th>Apellido</th><th>Email</th><th>Obra social</th></tr></thead>
            <tbody>
              {pacientes.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td><td>{p.nombre}</td><td>{p.apellido}</td><td>{p.email}</td><td>{p.obra_social ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p>No hay pacientes.</p>}
      </section>

      {/* 2. Registro de médicos */}
{/* ───── Registrar médico ───── */}
<section style={{ marginTop: '2rem' }}>
  <h2>Registrar médico</h2>

  {/* Datos básicos */}
  <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
  <input placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} />
  <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
  <input placeholder="Contraseña" value={contrasena} onChange={e => setContrasena(e.target.value)} />

  {/* Especialidades */}
  <p>Especialidades:</p>
  {especialidades.map(e => (
    <label key={e.id} style={{ marginRight: '0.5rem' }}>
      <input
        type="checkbox"
        checked={seleccionadas.includes(e.id)}
        onChange={() => toggleEspecialidad(e.id)}
      />
      {e.nombre}
    </label>
  ))}

  {/* Horarios con select + reloj */}
  <p>Horarios:</p>
  <button onClick={agregarHorario}>Añadir horario</button>

  {horarios.map((h, i) => (
    <div key={i} style={{ marginBottom: '0.5rem' }}>
      {/* Día de la semana */}
      <select
        value={h.dia_semana}
        onChange={e => actualizarHorario(i, 'dia_semana', e.target.value)}
        style={{ marginRight: '0.5rem' }}
      >
        <option value="">Día</option>
        <option value="Lunes">Lunes</option>
        <option value="Martes">Martes</option>
        <option value="Miércoles">Miércoles</option>
        <option value="Jueves">Jueves</option>
        <option value="Viernes">Viernes</option>
        <option value="Sábado">Sábado</option>
      </select>

      {/* Hora inicio */}
      <input
        type="time"
        step="1800"              /* 30 min */
        value={h.hora_inicio}
        onChange={e => actualizarHorario(i, 'hora_inicio', e.target.value)}
        style={{ marginRight: '0.5rem' }}
      />

      {/* Hora fin */}
      <input
        type="time"
        step="1800"
        value={h.hora_fin}
        onChange={e => actualizarHorario(i, 'hora_fin', e.target.value)}
      />
    </div>
  ))}

  <button onClick={registrarMedico}>Registrar</button>
  {mensajeRegistro && <p>{mensajeRegistro}</p>}
</section>

      {/* 3. Médicos por especialidad */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Médicos por especialidad</h2>
        <select value={especialidadId} onChange={e => setEspecialidadId(e.target.value)}>
          <option value="">Seleccionar especialidad</option>
          {especialidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <button onClick={buscarMedicosPorEspecialidad}>Buscar</button>
        {medicos.map(m => (
          <div key={m.id} style={{ border: '1px solid #ccc', padding: '0.5rem', marginTop: '0.5rem' }}>
            <p>{m.nombre} {m.apellido} — {m.email}</p>
            <input placeholder="Desde (YYYY-MM-DD)" value={desde} onChange={e => setDesde(e.target.value)} />
            <input placeholder="Hasta (YYYY-MM-DD)" value={hasta} onChange={e => setHasta(e.target.value)} />
            <button onClick={() => obtenerCantidadAtendidos(m.id)}>Ver atendidos</button>
            {pacientesAtendidos?.id === m.id && <span style={{ marginLeft: '1rem' }}>Pacientes: {pacientesAtendidos.cantidad}</span>}
          </div>
        ))}
      </section>

      {/* 4. Formularios médicos */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Buscar formularios médicos</h2>
        <input placeholder="Nombre paciente" value={filtroNombre} onChange={e => setFiltroNombre(e.target.value)} />
        <input placeholder="ID Doctor" value={filtroDoctorId} onChange={e => setFiltroDoctorId(e.target.value)} />
        <button onClick={buscarFormularios}>Buscar</button>
        {formularios.map(f => (
          <div key={f.id} style={{ border: '1px solid #ddd', marginTop: '0.5rem', padding: '0.5rem' }}>
            <p><strong>Paciente:</strong> {f.nombre_completo}</p>
            <p><strong>Fecha:</strong> {f.fecha}</p>
            <p><strong>Doctor:</strong> {f.doctor_nombre} {f.doctor_apellido}</p>
            <p><strong>Contenido:</strong> {f.contenido}</p>
          </div>
        ))}
      </section>

      {/* 5. Agendar turno */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Agendar turno (admin)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '400px' }}>
          <label>Paciente
            <select value={pacienteSeleccionado} onChange={e => setPacienteSeleccionado(e.target.value)}>
              <option value="">-- seleccionar --</option>
              {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
          </label>

          <label>Especialidad
            <select value={espTurno} onChange={e => setEspTurno(e.target.value)}>
              <option value="">-- seleccionar --</option>
              {especialidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </label>

          <label>Doctor
            <select value={doctorTurno} onChange={e => setDoctorTurno(e.target.value)}>
              <option value="">-- seleccionar --</option>
              {doctoresLista.map(d => <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>)}
            </select>
          </label>

          <label>Fecha
            <input type="date" value={fechaTurno} onChange={e => setFechaTurno(e.target.value)} />
          </label>

          <label>Hora
            <select value={horaTurno} onChange={e => setHoraTurno(e.target.value)}>
              <option value="">-- seleccionar --</option>
              {bloquesDisponibles().map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </label>

          <label>Detalles
            <textarea value={detalles} onChange={e => setDetalles(e.target.value)} />
          </label>

          <button onClick={solicitarTurno}>Solicitar turno</button>
          {msgTurno && <p style={{ color: 'green' }}>{msgTurno}</p>}
          {errTurno && <p style={{ color: 'red' }}>{errTurno}</p>}
        </div>
      </section>
    </div>
  );
}
