import { useState } from 'react';
import axios from '../components/axios/axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(`http://172.20.10.13:3001/api/auth/login`, {
        email,
        contrasena: password
      });

      const usuario = res.data.usuario;

      if (!usuario || !usuario.tipo) {
        setError('Usuario no válido o sin tipo asignado');
        return;
      }

      if (usuario.tipo === 'paciente') {
        navigate('/paciente-dashboard', { state: { usuario } });
      } else if (usuario.tipo === 'medico') {
        navigate('/doctor-dashboard', { state: { usuario } });
      } else if (usuario.tipo === 'admin') {
        navigate('/admin-dashboard', { state: { usuario } });
      } else {
        setError('Tipo de usuario desconocido');
      }

    } catch (err) {
      console.error('Error en login:', err);
      setError(err.response?.data?.mensaje || 'Correo o contraseña incorrectos');
    }
  };

  return (
    <div className="container">
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleLogin}>
        <label>Correo electrónico:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Contraseña:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Ingresar</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>¿No tenés cuenta? <a href="/registro">Registrate aquí</a></p>
    </div>
  );
}

export default Login;
