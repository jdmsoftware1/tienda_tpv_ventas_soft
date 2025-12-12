import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Empleados from './pages/Empleados';
import Articulos from './pages/Articulos';
import Compras from './pages/Compras';
import Pagos from './pages/Pagos';
import Devoluciones from './pages/Devoluciones';
import CierreMes from './pages/CierreMes';
import Fichaje from './pages/Fichaje';
import RegistrosEmpleados from './pages/RegistrosEmpleados';
import GestionHorarios from './pages/GestionHorarios';
import Festivos from './pages/Festivos';
import Vacaciones from './pages/Vacaciones';
import PlantillasHorarias from './pages/PlantillasHorarias';
import BajasMedicas from './pages/BajasMedicas';
import CalendarioPersonal from './pages/CalendarioPersonal';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/compras" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/fichaje" element={<Fichaje />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="empleados" element={<Empleados />} />
          <Route path="articulos" element={<Articulos />} />
          <Route path="compras" element={<Compras />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="devoluciones" element={<Devoluciones />} />
          <Route path="cierre-mes" element={<AdminRoute><CierreMes /></AdminRoute>} />
          <Route path="registros-empleados" element={<AdminRoute><RegistrosEmpleados /></AdminRoute>} />
          <Route path="horarios" element={<AdminRoute><GestionHorarios /></AdminRoute>} />
          <Route path="plantillas-horarias" element={<AdminRoute><PlantillasHorarias /></AdminRoute>} />
          <Route path="bajas-medicas" element={<AdminRoute><BajasMedicas /></AdminRoute>} />
          <Route path="calendario-personal" element={<CalendarioPersonal />} />
          <Route path="festivos" element={<Festivos />} />
          <Route path="vacaciones" element={<Vacaciones />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
