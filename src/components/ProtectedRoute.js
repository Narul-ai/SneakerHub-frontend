import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  // Убрали 'user', так как используем только isAuthenticated и isAdmin
  const { loading, isAdmin, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-spinner">Загрузка...</div>;
  }

  // 1. Если не авторизован
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Если нужен админ, а юзер — не админ
  if (adminOnly && !isAdmin) {
    console.warn("Попытка несанкционированного доступа!");
    return <Navigate to="/" replace />;
  }

  // 3. Всё хорошо — показываем страницу
  return children;
};

export default ProtectedRoute;