import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import type {ReactNode} from 'react';

// Importação das páginas
import Login from '../pages/Login/index';
import Register from '../pages/Register/index';
import Dashboard from '../pages/Dashboard/index';
import CourseDetails from '../pages/CourseDetails/index';

// Componente para proteger rotas
const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rotas Privadas (Protegidas) */}
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      <Route path="/courses/:id" element={
        <PrivateRoute>
          <CourseDetails />
        </PrivateRoute>
      } />

      {/* Redireciona qualquer rota inválida para o Dashboard (que mandará pro login se não autenticado) */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};