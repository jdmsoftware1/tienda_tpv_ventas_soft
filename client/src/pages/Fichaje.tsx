import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Clock, LogIn, LogOut, Coffee, PlayCircle } from 'lucide-react';

interface Empleado {
  id: string;
  nombre: string;
  id_empleado: string;
  totp_enabled: boolean;
}

enum TipoFichaje {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  INICIO_DESCANSO = 'inicio_descanso',
  FIN_DESCANSO = 'fin_descanso',
}

export default function Fichaje() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [token, setToken] = useState('');
  const [tipo, setTipo] = useState<TipoFichaje>(TipoFichaje.ENTRADA);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadEmpleados();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadEmpleados = async () => {
    try {
      const response = await api.get('/empleados');
      // Filtrar solo empleados con TOTP habilitado
      const empleadosConTOTP = response.data.filter((emp: Empleado) => emp.totp_enabled);
      setEmpleados(empleadosConTOTP);
    } catch (error) {
      toast.error('Error al cargar empleados');
    }
  };

  const handleFichaje = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmpleado) {
      toast.error('Selecciona un empleado');
      return;
    }

    if (token.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      await api.post('/fichajes', {
        empleadoId: selectedEmpleado,
        tipo,
        token,
      });

      toast.success('Fichaje registrado correctamente');
      setToken('');
      setSelectedEmpleado('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar fichaje');
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = (tipoFichaje: TipoFichaje) => {
    switch (tipoFichaje) {
      case TipoFichaje.ENTRADA:
        return <LogIn className="w-5 h-5" />;
      case TipoFichaje.SALIDA:
        return <LogOut className="w-5 h-5" />;
      case TipoFichaje.INICIO_DESCANSO:
        return <Coffee className="w-5 h-5" />;
      case TipoFichaje.FIN_DESCANSO:
        return <PlayCircle className="w-5 h-5" />;
    }
  };

  const getTipoLabel = (tipoFichaje: TipoFichaje) => {
    switch (tipoFichaje) {
      case TipoFichaje.ENTRADA:
        return 'Entrada';
      case TipoFichaje.SALIDA:
        return 'Salida';
      case TipoFichaje.INICIO_DESCANSO:
        return 'Inicio Descanso';
      case TipoFichaje.FIN_DESCANSO:
        return 'Fin Descanso';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Reloj */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-16 h-16 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentTime.toLocaleTimeString('es-ES')}
          </h1>
          <p className="text-gray-600">
            {currentTime.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleFichaje} className="space-y-6">
          {/* Seleccionar Empleado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empleado
            </label>
            <select
              value={selectedEmpleado}
              onChange={(e) => setSelectedEmpleado(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Selecciona tu nombre</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} ({emp.id_empleado})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Fichaje */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Fichaje
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(TipoFichaje).map((tipoFichaje) => (
                <button
                  key={tipoFichaje}
                  type="button"
                  onClick={() => setTipo(tipoFichaje)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    tipo === tipoFichaje
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {getTipoIcon(tipoFichaje)}
                  <span className="text-sm font-medium">{getTipoLabel(tipoFichaje)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Código TOTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Autenticación
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
              maxLength={6}
              required
            />
            <p className="mt-2 text-sm text-gray-500 text-center">
              Introduce el código de 6 dígitos de Google Authenticator
            </p>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Registrar Fichaje'}
          </button>
        </form>
      </div>
    </div>
  );
}
