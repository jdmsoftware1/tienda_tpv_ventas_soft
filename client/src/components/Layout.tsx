import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Menu,
  X,
  Home,
  Users,
  UserCircle,
  Package,
  ShoppingCart,
  CreditCard,
  RotateCcw,
  Calendar,
  LogOut,
} from 'lucide-react';
import Logo from '../Images/Decoraciones.png';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navigation = [
    ...(user?.role === 'admin' ? [{ name: 'Dashboard', href: '/', icon: Home }] : []),
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Empleados', href: '/empleados', icon: UserCircle },
    { name: 'Artículos', href: '/articulos', icon: Package },
    { name: 'Compras', href: '/compras', icon: ShoppingCart },
    { name: 'Pagos', href: '/pagos', icon: CreditCard },
    { name: 'Devoluciones', href: '/devoluciones', icon: RotateCcw },
    ...(user?.role === 'admin' ? [{ name: 'Cierre de Mes', href: '/cierre-mes', icon: Calendar }] : []),
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <img src={Logo} alt="Logo" className="h-10 w-10 object-contain" />
                <h1 className="text-lg font-bold text-primary-700">Ángel e Hijas</h1>
              </div>
            ) : (
              <img src={Logo} alt="Logo" className="h-8 w-8 object-contain" />
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white flex-shrink-0">
                {user?.nombre.charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.nombre}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ${
                !sidebarOpen && 'justify-center'
              }`}
              title={!sidebarOpen ? 'Cerrar sesión' : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span>Cerrar sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`transition-all duration-300 flex flex-col min-h-screen ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <main className="flex-1 p-6">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <img src={Logo} alt="Logo" className="h-8 w-8 object-contain" />
              <span className="font-semibold text-gray-700">Decoraciones Ángel e Hijas</span>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                v1.0.3
              </span>
            </div>
            <div className="mt-2 md:mt-0">
              © {new Date().getFullYear()} <span className="font-medium text-gray-700">JDMSoftware</span>. Todos los derechos reservados.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
