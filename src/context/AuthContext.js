import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Инициализируем user СРАЗУ из localStorage, чтобы не было "мигания" null
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // Исправленный эффект: обновляем localStorage только если user реально существует
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      // Если юзер явно вышел (logout), тогда удаляем
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Устанавливаем заголовок для всех будущих запросов axios
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Проверяем токен на бэкенде
          const { data } = await axios.get('http://localhost:5000/api/auth/profile');
          setUser(data); 
        } catch (error) {
          console.error("Сессия истекла или сервер недоступен");
          // Если токен "протух" — разлогиниваем
          if (error.response && error.response.status === 401) {
             logout();
          }
        }
      }
      setLoading(false);
    };
    
    checkLoggedIn();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    // Вместо жесткого редиректа лучше просто обнулить юзера, 
    // а редирект сделает ProtectedRoute в App.js
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      login, 
      logout, 
      loading, 
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin' 
    }}>
      {/* 
         Важно: если loading = true, мы ничего не рендерим, 
         чтобы App.js не успел сработать и выкинуть нас на логин
      */}
      {!loading ? children : <div className="loading-screen">Загрузка...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};