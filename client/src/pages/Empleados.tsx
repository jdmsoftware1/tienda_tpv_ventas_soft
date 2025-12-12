import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, QrCode, Shield, ShieldOff } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface Empleado {
  id: string;
  id_empleado: string;
  nombre: string;
  totp_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export default function Empleados() {
  const { user } = useAuthStore();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [qrData, setQrData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [totpToken, setTotpToken] = useState('');
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
  const [formData, setFormData] = useState({
    id_empleado: '',
    nombre: '',
  });

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    try {
      setLoading(true);
      const response = await api.get('/empleados');
      setEmpleados(response.data);
    } catch (error) {
      toast.error('Error al cargar empleados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchEmpleados();
      return;
    }
    try {
      const response = await api.get(`/empleados/search/${searchTerm}`);
      setEmpleados([response.data]);
      toast.success('Empleado encontrado');
    } catch (error) {
      toast.error('Empleado no encontrado');
      setEmpleados([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmpleado) {
        await api.patch(`/empleados/${editingEmpleado.id}`, formData);
        toast.success('Empleado actualizado correctamente');
      } else {
        await api.post('/empleados', formData);
        toast.success('Empleado creado correctamente');
      }
      setShowModal(false);
      setFormData({ id_empleado: '', nombre: '' });
      setEditingEmpleado(null);
      fetchEmpleados();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar empleado');
    }
  };

  const handleEdit = (empleado: Empleado) => {
    setEditingEmpleado(empleado);
    setFormData({
      id_empleado: empleado.id_empleado,
      nombre: empleado.nombre,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este empleado?')) return;
    try {
      await api.delete(`/empleados/${id}`);
      toast.success('Empleado eliminado correctamente');
      fetchEmpleados();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar empleado');
    }
  };

  const openCreateModal = () => {
    setEditingEmpleado(null);
    setFormData({ id_empleado: '', nombre: '' });
    setShowModal(true);
  };

  const handleGenerateQR = async (empleado: Empleado) => {
    try {
      const response = await api.post(`/empleados/${empleado.id}/totp/generate`);
      setQrData(response.data);
      setSelectedEmpleado(empleado);
      setShowQRModal(true);
      toast.success('Código QR generado');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al generar QR');
    }
  };

  const handleEnableTOTP = async () => {
    if (!selectedEmpleado || !totpToken) {
      toast.error('Introduce el código de verificación');
      return;
    }

    try {
      await api.post(`/empleados/${selectedEmpleado.id}/totp/enable`, { token: totpToken });
      toast.success('Google Authenticator habilitado correctamente');
      setShowQRModal(false);
      setTotpToken('');
      setQrData(null);
      setSelectedEmpleado(null);
      fetchEmpleados();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Código inválido');
    }
  };

  const handleDisableTOTP = async (empleado: Empleado) => {
    if (!confirm('¿Desactivar Google Authenticator para este empleado?')) return;

    try {
      await api.post(`/empleados/${empleado.id}/totp/disable`);
      toast.success('Google Authenticator deshabilitado');
      fetchEmpleados();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al deshabilitar');
    }
  };

  const filteredEmpleados = empleados.filter(emp =>
    emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.id_empleado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Nuevo Empleado
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por ID o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Buscar
          </button>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                fetchEmpleados();
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : filteredEmpleados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay empleados registrados</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Google Auth
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmpleados.map((empleado) => (
                <tr key={empleado.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {empleado.id_empleado}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {empleado.nombre}
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {empleado.totp_enabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          <Shield size={14} />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                          <ShieldOff size={14} />
                          Inactivo
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(empleado.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user?.role === 'admin' && (
                      <>
                        {empleado.totp_enabled ? (
                          <button
                            onClick={() => handleDisableTOTP(empleado)}
                            className="text-orange-600 hover:text-orange-900 mr-4"
                            title="Deshabilitar Google Authenticator"
                          >
                            <ShieldOff size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGenerateQR(empleado)}
                            className="text-green-600 hover:text-green-900 mr-4"
                            title="Generar código QR"
                          >
                            <QrCode size={18} />
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => handleEdit(empleado)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(empleado.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Empleado *
                </label>
                <input
                  type="text"
                  required
                  value={formData.id_empleado}
                  onChange={(e) => setFormData({ ...formData, id_empleado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: EMP001"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nombre completo"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingEmpleado ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR Google Authenticator */}
      {showQRModal && qrData && selectedEmpleado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Google Authenticator
              </h2>
              <button 
                onClick={() => {
                  setShowQRModal(false);
                  setQrData(null);
                  setTotpToken('');
                  setSelectedEmpleado(null);
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Empleado: <strong>{selectedEmpleado.nombre}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Escanea este código QR con Google Authenticator
              </p>
              
              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <img src={qrData.qrCode} alt="QR Code" className="w-64 h-64" />
              </div>

              {/* Secret (por si falla el QR) */}
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-gray-500 mb-1">Código manual:</p>
                <p className="text-sm font-mono font-semibold text-gray-900 break-all">
                  {qrData.secret}
                </p>
              </div>
            </div>

            {/* Verificación */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Verificación (6 dígitos)
              </label>
              <input
                type="text"
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                maxLength={6}
              />
              <p className="mt-2 text-xs text-gray-500">
                Introduce el código que aparece en Google Authenticator para habilitar
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowQRModal(false);
                  setQrData(null);
                  setTotpToken('');
                  setSelectedEmpleado(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnableTOTP}
                disabled={totpToken.length !== 6}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Habilitar
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Instrucciones:</strong><br />
                1. Descarga Google Authenticator en tu móvil<br />
                2. Escanea el código QR<br />
                3. Introduce el código de 6 dígitos para verificar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
