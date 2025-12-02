import { useState, useEffect } from 'react';
import { Plus, FileText, Eye, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface CierreMesData {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  total_ventas: number;
  total_pagos: number;
  total_devoluciones: number;
  cerrado: boolean;
  created_at: string;
}

interface PreviewStats {
  total_ventas: number;
  total_pagos: number;
  total_devoluciones: number;
  cantidad_ventas: number;
  cantidad_pagos: number;
  cantidad_devoluciones: number;
}

export default function CierreMes() {
  const { user } = useAuthStore();
  const [cierres, setCierres] = useState<CierreMesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCierre, setSelectedCierre] = useState<CierreMesData | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [previewStats, setPreviewStats] = useState<PreviewStats | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchCierres();
    // Establecer fechas por defecto al mes anterior
    const now = new Date();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    setFechaInicio(firstDayLastMonth.toISOString().split('T')[0]);
    setFechaFin(lastDayLastMonth.toISOString().split('T')[0]);
  }, []);

  const fetchCierres = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cierre-mes');
      setCierres(response.data);
    } catch (error) {
      toast.error('Error al cargar cierres de mes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Seleccione las fechas');
      return;
    }

    try {
      setLoadingPreview(true);
      // Obtener estadísticas del rango seleccionado
      const [comprasRes, pagosRes, devolucionesRes] = await Promise.all([
        api.get('/compras'),
        api.get('/pagos'),
        api.get('/devoluciones'),
      ]);

      const inicio = new Date(fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);

      const compras = comprasRes.data.filter((c: any) => {
        const date = new Date(c.created_at);
        return date >= inicio && date <= fin && !c.cierre_mes_id;
      });

      const pagos = pagosRes.data.filter((p: any) => {
        const date = new Date(p.created_at);
        return date >= inicio && date <= fin && !p.cierre_mes_id;
      });

      const devoluciones = devolucionesRes.data.filter((d: any) => {
        const date = new Date(d.created_at);
        return date >= inicio && date <= fin && !d.cierre_mes_id;
      });

      setPreviewStats({
        total_ventas: compras.reduce((sum: number, c: any) => sum + Number(c.total), 0),
        total_pagos: pagos.reduce((sum: number, p: any) => sum + Number(p.monto), 0),
        total_devoluciones: devoluciones.reduce((sum: number, d: any) => sum + Number(d.monto), 0),
        cantidad_ventas: compras.length,
        cantidad_pagos: pagos.length,
        cantidad_devoluciones: devoluciones.length,
      });
    } catch (error) {
      toast.error('Error al obtener vista previa');
      console.error(error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCreateCierre = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Seleccione las fechas');
      return;
    }

    if (!previewStats) {
      toast.error('Primero obtenga la vista previa');
      return;
    }

    if (previewStats.cantidad_ventas === 0 && previewStats.cantidad_pagos === 0 && previewStats.cantidad_devoluciones === 0) {
      toast.error('No hay transacciones para cerrar en este período');
      return;
    }

    try {
      await api.post('/cierre-mes', {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      toast.success('Cierre de mes creado correctamente');
      setShowModal(false);
      setPreviewStats(null);
      fetchCierres();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear cierre de mes');
    }
  };

  const viewDetails = (cierre: CierreMesData) => {
    setSelectedCierre(cierre);
    setShowDetailModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cierres de Mes</h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            Nuevo Cierre
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">Solo los administradores pueden crear nuevos cierres de mes.</p>
        </div>
      )}

      {/* Lista de Cierres */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : cierres.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay cierres de mes registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {cierres.map((cierre) => {
              const balance = Number(cierre.total_ventas) - Number(cierre.total_pagos) - Number(cierre.total_devoluciones);
              return (
                <div key={cierre.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {formatDate(cierre.fecha_inicio)} - {formatDate(cierre.fecha_fin)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Creado el {formatDate(cierre.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Ventas</p>
                        <p className="font-semibold text-primary-600">{formatCurrency(Number(cierre.total_ventas))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Pagos</p>
                        <p className="font-semibold text-green-600">{formatCurrency(Number(cierre.total_pagos))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Devoluciones</p>
                        <p className="font-semibold text-orange-600">{formatCurrency(Number(cierre.total_devoluciones))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Balance</p>
                        <p className={`font-semibold ${balance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                          {formatCurrency(balance)}
                        </p>
                      </div>
                      <button
                        onClick={() => viewDetails(cierre)}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                      >
                        <Eye size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nuevo Cierre */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nuevo Cierre de Mes</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => {
                      setFechaInicio(e.target.value);
                      setPreviewStats(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => {
                      setFechaFin(e.target.value);
                      setPreviewStats(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={fetchPreview}
                disabled={loadingPreview}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {loadingPreview ? 'Calculando...' : 'Ver Vista Previa'}
              </button>

              {previewStats && (
                <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-purple-900">Vista Previa del Cierre</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Ventas</p>
                      <p className="font-bold text-primary-600">{formatCurrency(previewStats.total_ventas)}</p>
                      <p className="text-xs text-gray-500">{previewStats.cantidad_ventas} transacciones</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pagos</p>
                      <p className="font-bold text-green-600">{formatCurrency(previewStats.total_pagos)}</p>
                      <p className="text-xs text-gray-500">{previewStats.cantidad_pagos} transacciones</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Devoluciones</p>
                      <p className="font-bold text-orange-600">{formatCurrency(previewStats.total_devoluciones)}</p>
                      <p className="text-xs text-gray-500">{previewStats.cantidad_devoluciones} transacciones</p>
                    </div>
                  </div>
                  <div className="border-t border-purple-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-purple-900">Balance Neto:</span>
                      <span className={`font-bold text-lg ${
                        previewStats.total_ventas - previewStats.total_pagos - previewStats.total_devoluciones >= 0 
                          ? 'text-purple-600' 
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(previewStats.total_ventas - previewStats.total_pagos - previewStats.total_devoluciones)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPreviewStats(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCierre}
                disabled={!previewStats}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Crear Cierre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {showDetailModal && selectedCierre && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Detalle del Cierre</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">
                    {formatDate(selectedCierre.fecha_inicio)} - {formatDate(selectedCierre.fecha_fin)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-600" />
                    <div>
                      <p className="text-sm text-gray-500">Ventas</p>
                      <p className="font-semibold">{formatCurrency(Number(selectedCierre.total_ventas))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Pagos</p>
                      <p className="font-semibold">{formatCurrency(Number(selectedCierre.total_pagos))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-500">Devoluciones</p>
                      <p className="font-semibold">{formatCurrency(Number(selectedCierre.total_devoluciones))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Balance</p>
                      <p className="font-semibold">
                        {formatCurrency(
                          Number(selectedCierre.total_ventas) - 
                          Number(selectedCierre.total_pagos) - 
                          Number(selectedCierre.total_devoluciones)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Creado el {new Date(selectedCierre.created_at).toLocaleString('es-ES')}
              </p>
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
