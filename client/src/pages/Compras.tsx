import { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Eye, Printer, Barcode } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Empleado {
  id: string;
  id_empleado: string;
  nombre: string;
}

interface Cliente {
  id: string;
  num_cliente: string;
  nombre: string;
  empleado_id: string;
  empleado?: Empleado;
}

interface Articulo {
  id: string;
  codigo_barras: string;
  nombre: string;
  precio_venta: number;
  cantidad: number;
}

interface CompraArticulo {
  articulo_id: string;
  cantidad: number;
  precio_unitario: number;
  articulo?: Articulo;
}

interface Compra {
  id: string;
  cliente: Cliente;
  total: number;
  descripcion: string;
  es_varios: boolean;
  articulos: CompraArticulo[];
  created_at: string;
}

interface ItemCarrito {
  articulo_id: string;
  articulo: Articulo;
  cantidad: number;
  precio_unitario: number;
}

export default function Compras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmpleadoId, setFilterEmpleadoId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  
  // Form data
  const [clienteId, setClienteId] = useState('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [codigoBarras, setCodigoBarras] = useState('');
  const [cantidadInput, setCantidadInput] = useState('1');
  const [montoVarios, setMontoVarios] = useState('');
  const [descripcionVarios, setDescripcionVarios] = useState('');
  
  // Ticket data
  const [ticketCompra, setTicketCompra] = useState<Compra | null>(null);
  
  const codigoInputRef = useRef<HTMLInputElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCompras();
    fetchClientes();
    fetchEmpleados();
    fetchArticulos();
  }, []);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const response = await api.get('/compras');
      setCompras(response.data);
    } catch (error) {
      toast.error('Error al cargar compras');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const fetchEmpleados = async () => {
    try {
      const response = await api.get('/empleados');
      setEmpleados(response.data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  const fetchArticulos = async () => {
    try {
      const response = await api.get('/articulos');
      setArticulos(response.data);
    } catch (error) {
      console.error('Error al cargar artículos:', error);
    }
  };

  // Buscar artículo por código de barras
  const buscarPorCodigo = () => {
    if (!codigoBarras.trim()) return;
    
    const articulo = articulos.find(a => a.codigo_barras === codigoBarras.trim());
    if (!articulo) {
      toast.error('Artículo no encontrado');
      setCodigoBarras('');
      return;
    }
    
    agregarAlCarrito(articulo);
    setCodigoBarras('');
    codigoInputRef.current?.focus();
  };

  // Agregar artículo al carrito
  const agregarAlCarrito = (articulo: Articulo) => {
    const cantidad = parseInt(cantidadInput) || 1;
    
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    
    // Verificar stock disponible considerando lo que ya está en el carrito
    const enCarrito = carrito.find(item => item.articulo_id === articulo.id);
    const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
    
    if (cantidad + cantidadEnCarrito > articulo.cantidad) {
      toast.error(`Stock insuficiente. Disponible: ${articulo.cantidad - cantidadEnCarrito}`);
      return;
    }
    
    if (enCarrito) {
      // Actualizar cantidad si ya existe
      setCarrito(carrito.map(item => 
        item.articulo_id === articulo.id 
          ? { ...item, cantidad: item.cantidad + cantidad }
          : item
      ));
    } else {
      // Agregar nuevo item
      setCarrito([...carrito, {
        articulo_id: articulo.id,
        articulo,
        cantidad,
        precio_unitario: articulo.precio_venta,
      }]);
    }
    
    setCantidadInput('1');
    toast.success(`${articulo.nombre} agregado`);
  };

  // Eliminar del carrito
  const eliminarDelCarrito = (index: number) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  // Calcular total del carrito
  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  };

  // Registrar compra con artículos
  const handleSubmitArticulos = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteId) {
      toast.error('Seleccione un cliente');
      return;
    }
    
    if (carrito.length === 0) {
      toast.error('Agregue al menos un artículo');
      return;
    }
    
    try {
      const payload = {
        cliente_id: clienteId,
        es_varios: false,
        articulos: carrito.map(item => ({
          articulo_id: item.articulo_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
        })),
      };
      
      const response = await api.post('/compras', payload);
      toast.success('Compra registrada correctamente');
      
      // Mostrar ticket
      setTicketCompra(response.data);
      setShowModal(false);
      setShowTicketModal(true);
      
      resetForm();
      fetchCompras();
      fetchArticulos(); // Actualizar stock
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar compra');
    }
  };

  // Registrar compra VARIOS (solo cantidad sin artículos)
  const handleSubmitVarios = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteId) {
      toast.error('Seleccione un cliente');
      return;
    }
    
    const monto = parseFloat(montoVarios);
    if (!monto || monto <= 0) {
      toast.error('Ingrese una cantidad válida');
      return;
    }
    
    try {
      const payload = {
        cliente_id: clienteId,
        es_varios: true,
        total: monto,
        descripcion: descripcionVarios || 'VARIOS',
      };
      
      const response = await api.post('/compras', payload);
      toast.success('Compra registrada correctamente');
      
      // Mostrar ticket
      setTicketCompra(response.data);
      setShowModal(false);
      setShowTicketModal(true);
      
      resetForm();
      fetchCompras();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar compra');
    }
  };

  const resetForm = () => {
    setClienteId('');
    setCarrito([]);
    setCodigoBarras('');
    setCantidadInput('1');
    setMontoVarios('');
    setDescripcionVarios('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const viewDetails = (compra: Compra) => {
    setSelectedCompra(compra);
    setShowDetailModal(true);
  };

  const viewTicket = (compra: Compra) => {
    setTicketCompra(compra);
    setShowTicketModal(true);
  };

  const handlePrint = () => {
    const printContent = ticketRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Compra</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; width: 80mm; }
            .ticket { max-width: 80mm; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h1 { font-size: 16px; margin: 0; }
            .header p { margin: 2px 0; font-size: 10px; }
            .info { margin-bottom: 10px; }
            .info p { margin: 2px 0; }
            .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .item-name { flex: 1; }
            .item-qty { width: 30px; text-align: center; }
            .item-price { width: 60px; text-align: right; }
            .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtrar compras por empleado
  const filteredCompras = compras.filter((compra) => {
    if (!filterEmpleadoId) return true;
    const cliente = clientes.find(c => c.id === compra.cliente.id);
    return cliente?.empleado_id === filterEmpleadoId;
  });

  const selectedCliente = clientes.find(c => c.id === clienteId);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Nueva Compra
        </button>
      </div>

      {/* Filtro por Empleado */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por empleado:</label>
          <select
            value={filterEmpleadoId}
            onChange={(e) => setFilterEmpleadoId(e.target.value)}
            className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos los empleados</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre}
              </option>
            ))}
          </select>
          {filterEmpleadoId && (
            <button
              onClick={() => setFilterEmpleadoId('')}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : filteredCompras.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay compras registradas</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompras.map((compra) => (
                <tr key={compra.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(compra.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {compra.cliente.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      compra.es_varios ? 'bg-purple-100 text-purple-800' : 'bg-primary-100 text-primary-800'
                    }`}>
                      {compra.es_varios ? 'VARIOS' : 'Artículos'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(compra.total)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {compra.descripcion || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => viewDetails(compra)}
                      className="text-primary-600 hover:text-primary-900"
                      title="Ver detalles"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => viewTicket(compra)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Ver ticket"
                    >
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Nueva Compra</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            {/* Selección de cliente */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Seleccione un cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} ({cliente.num_cliente})
                  </option>
                ))}
              </select>
            </div>

            {selectedCliente && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Panel izquierdo: Agregar artículos */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Barcode size={20} />
                    Agregar Artículos
                  </h3>
                  
                  {/* Búsqueda por código de barras */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Barras
                    </label>
                    <div className="flex gap-2">
                      <input
                        ref={codigoInputRef}
                        type="text"
                        value={codigoBarras}
                        onChange={(e) => setCodigoBarras(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && buscarPorCodigo()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Escanear o escribir código..."
                        autoFocus
                      />
                      <input
                        type="number"
                        min="1"
                        value={cantidadInput}
                        onChange={(e) => setCantidadInput(e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Cant."
                      />
                      <button
                        type="button"
                        onClick={buscarPorCodigo}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  {/* Lista de artículos disponibles */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      O seleccionar artículo:
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {articulos.filter(a => a.cantidad > 0).map((articulo) => (
                        <button
                          key={articulo.id}
                          type="button"
                          onClick={() => agregarAlCarrito(articulo)}
                          className="w-full text-left px-3 py-2 hover:bg-primary-50 border-b border-gray-100 last:border-b-0 flex justify-between items-center"
                        >
                          <span className="text-sm">{articulo.nombre}</span>
                          <span className="text-xs text-gray-500">
                            {formatCurrency(articulo.precio_venta)} (Stock: {articulo.cantidad})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Opción VARIOS */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      O registrar como VARIOS (sin artículos):
                    </h4>
                    <form onSubmit={handleSubmitVarios} className="space-y-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={montoVarios}
                        onChange={(e) => setMontoVarios(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Cantidad (€)"
                      />
                      <input
                        type="text"
                        value={descripcionVarios}
                        onChange={(e) => setDescripcionVarios(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Descripción (opcional, por defecto: VARIOS)"
                      />
                      <button
                        type="submit"
                        disabled={!montoVarios}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Registrar como VARIOS
                      </button>
                    </form>
                  </div>
                </div>

                {/* Panel derecho: Carrito */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Carrito de Compra
                  </h3>
                  
                  {carrito.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No hay artículos en el carrito</p>
                      <p className="text-sm mt-2">Escanee un código o seleccione artículos</p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-60 overflow-y-auto mb-4">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-2 py-2 text-left">Artículo</th>
                              <th className="px-2 py-2 text-center">Cant.</th>
                              <th className="px-2 py-2 text-right">Precio</th>
                              <th className="px-2 py-2 text-right">Subtotal</th>
                              <th className="px-2 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {carrito.map((item, index) => (
                              <tr key={index} className="border-t border-gray-100">
                                <td className="px-2 py-2 text-gray-900">{item.articulo.nombre}</td>
                                <td className="px-2 py-2 text-center">{item.cantidad}</td>
                                <td className="px-2 py-2 text-right text-gray-600">{formatCurrency(item.precio_unitario)}</td>
                                <td className="px-2 py-2 text-right font-semibold">{formatCurrency(item.cantidad * item.precio_unitario)}</td>
                                <td className="px-2 py-2">
                                  <button
                                    type="button"
                                    onClick={() => eliminarDelCarrito(index)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center text-lg font-bold mb-4">
                          <span>TOTAL:</span>
                          <span className="text-primary-600">{formatCurrency(calcularTotal())}</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={handleSubmitArticulos}
                          className="w-full bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 font-semibold"
                        >
                          Registrar Compra
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {!selectedCliente && (
              <div className="text-center py-8 text-gray-500">
                <p>Seleccione un cliente para comenzar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCompra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Detalle de Compra</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-semibold">{selectedCompra.cliente.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-semibold">{formatDate(selectedCompra.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-semibold">{selectedCompra.es_varios ? 'VARIOS' : 'Artículos'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-semibold text-lg">{formatCurrency(selectedCompra.total)}</p>
                </div>
              </div>
              
              {selectedCompra.descripcion && (
                <div>
                  <p className="text-sm text-gray-500">Descripción</p>
                  <p className="font-semibold">{selectedCompra.descripcion}</p>
                </div>
              )}

              {!selectedCompra.es_varios && selectedCompra.articulos && selectedCompra.articulos.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Artículos</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Artículo</th>
                          <th className="px-3 py-2 text-left">Cantidad</th>
                          <th className="px-3 py-2 text-left">Precio Unit.</th>
                          <th className="px-3 py-2 text-left">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCompra.articulos.map((item, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-3 py-2">{item.articulo?.nombre || 'N/A'}</td>
                            <td className="px-3 py-2">{item.cantidad}</td>
                            <td className="px-3 py-2">{formatCurrency(item.precio_unitario)}</td>
                            <td className="px-3 py-2 font-semibold">{formatCurrency(item.cantidad * item.precio_unitario)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    viewTicket(selectedCompra);
                  }}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  <Printer size={18} />
                  Ver Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicketModal && ticketCompra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Ticket de Compra</h2>
              <button onClick={() => setShowTicketModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            {/* Ticket Preview */}
            <div ref={ticketRef} className="bg-white border-2 border-dashed border-gray-300 p-4 font-mono text-sm">
              <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
                <h1 className="text-lg font-bold">DECORACIONES</h1>
                <p className="text-xs">Ángel e Hijas</p>
                <p className="text-xs mt-2">{formatDate(ticketCompra.created_at)}</p>
              </div>
              
              <div className="mb-3">
                <p><strong>Cliente:</strong> {ticketCompra.cliente.nombre}</p>
                <p><strong>Nº Cliente:</strong> {ticketCompra.cliente.num_cliente}</p>
              </div>
              
              <div className="border-t border-b border-dashed border-gray-400 py-3 my-3">
                {ticketCompra.es_varios ? (
                  <div className="flex justify-between">
                    <span>{ticketCompra.descripcion || 'VARIOS'}</span>
                    <span>{formatCurrency(ticketCompra.total)}</span>
                  </div>
                ) : (
                  <>
                    {ticketCompra.articulos?.map((item, index) => (
                      <div key={index} className="mb-2">
                        <div className="flex justify-between">
                          <span className="flex-1 truncate">{item.articulo?.nombre}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{item.cantidad} x {formatCurrency(item.precio_unitario)}</span>
                          <span>{formatCurrency(item.cantidad * item.precio_unitario)}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
              
              <div className="text-right font-bold text-lg">
                TOTAL: {formatCurrency(ticketCompra.total)}
              </div>
              
              <div className="text-center mt-4 text-xs text-gray-500">
                <p>¡Gracias por su compra!</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowTicketModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                <Printer size={18} />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
