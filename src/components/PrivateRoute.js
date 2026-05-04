import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Пока контекст проверяет токен (загрузка), ничего не рендерим
  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка...</div>;
  }

  // 1. Если пользователя нет (не залогинен)
  if (!user) {
    // Сохраняем путь, куда он хотел попасть, чтобы вернуть его туда после логина
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Если страница "только для админа", а зашел обычный юзер
  if (adminOnly && user.role !== 'admin') {
    console.warn(`Доступ запрещен: ${user.username} не является админом.`);
    return <Navigate to="/" replace />; // Кидаем на главную, это безопаснее
  }

  // Если всё ок — показываем контент
  return children;
};

export default PrivateRoute;