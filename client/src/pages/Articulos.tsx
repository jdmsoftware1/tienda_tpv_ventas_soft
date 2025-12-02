import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Package, Barcode } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Articulo {
  id: string;
  codigo_barras: string;
  nombre: string;
  precio_compra: number;
  precio_venta: number;
  cantidad: number;
  created_at: string;
  updated_at: string;
}

export default function Articulos() {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null);
  const [formData, setFormData] = useState({
    codigo_barras: '',
    nombre: '',
    precio_compra: '',
    precio_venta: '',
    cantidad: '',
  });

  useEffect(() => {
    fetchArticulos();
  }, []);

  const fetchArticulos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/articulos');
      setArticulos(response.data);
    } catch (error) {
      toast.error('Error al cargar artículos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchArticulos();
      return;
    }
    try {
      const response = await api.get(`/articulos/barcode/${searchTerm}`);
      setArticulos([response.data]);
      toast.success('Artículo encontrado');
    } catch (error) {
      toast.error('Artículo no encontrado');
      setArticulos([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        precio_compra: parseFloat(formData.precio_compra),
        precio_venta: parseFloat(formData.precio_venta),
        cantidad: parseInt(formData.cantidad),
      };

      if (editingArticulo) {
        await api.patch(`/articulos/${editingArticulo.id}`, payload);
        toast.success('Artículo actualizado correctamente');
      } else {
        await api.post('/articulos', payload);
        toast.success('Artículo creado correctamente');
      }
      setShowModal(false);
      setFormData({ codigo_barras: '', nombre: '', precio_compra: '', precio_venta: '', cantidad: '' });
      setEditingArticulo(null);
      fetchArticulos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar artículo');
    }
  };

  const handleEdit = (articulo: Articulo) => {
    setEditingArticulo(articulo);
    setFormData({
      codigo_barras: articulo.codigo_barras,
      nombre: articulo.nombre,
      precio_compra: articulo.precio_compra.toString(),
      precio_venta: articulo.precio_venta.toString(),
      cantidad: articulo.cantidad.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este artículo?')) return;
    try {
      await api.delete(`/articulos/${id}`);
      toast.success('Artículo eliminado correctamente');
      fetchArticulos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar artículo');
    }
  };

  const openCreateModal = () => {
    setEditingArticulo(null);
    setFormData({ codigo_barras: '', nombre: '', precio_compra: '', precio_venta: '', cantidad: '' });
    setShowModal(true);
  };

  const filteredArticulos = articulos.filter(art =>
    art.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.codigo_barras.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const calculateMargin = (compra: number, venta: number): string => {
    if (compra === 0) return '0';
    return ((venta - compra) / compra * 100).toFixed(1);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Artículos</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Nuevo Artículo
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por código de barras o nombre..."
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
                fetchArticulos();
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
        ) : filteredArticulos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay artículos registrados</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código Barras
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P. Compra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P. Venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredArticulos.map((articulo) => (
                <tr key={articulo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {articulo.codigo_barras}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {articulo.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatCurrency(articulo.precio_compra)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {formatCurrency(articulo.precio_venta)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${
                      parseFloat(calculateMargin(articulo.precio_compra, articulo.precio_venta)) > 30 
                        ? 'text-green-600' 
                        : 'text-yellow-600'
                    }`}>
                      {calculateMargin(articulo.precio_compra, articulo.precio_venta)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`flex items-center gap-1 font-semibold ${
                      articulo.cantidad === 0 ? 'text-red-600' : articulo.cantidad < 10 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      <Package size={16} />
                      {articulo.cantidad}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(articulo)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(articulo.id)}
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
                {editingArticulo ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Barras *
                </label>
                <input
                  type="text"
                  required
                  value={formData.codigo_barras}
                  onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: 1234567890123"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nombre del artículo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Compra *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.precio_compra}
                    onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Venta *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.precio_venta}
                    onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad en Stock *
                </label>
                <input
                  type="number"
                  required
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
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
                  {editingArticulo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
