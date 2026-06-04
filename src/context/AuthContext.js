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

  // Динамический URL бэкенда из переменных окружения
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sneakerhub-vsiq.onrender.com';

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
          
          // Проверяем токен на бэкенде через API_BASE
          const { data } = await axios.get(`${API_BASE}/api/auth/profile`);
          setUser(data); 
        } catch (error) {
          console.error("Session expired or server is unreachable");
          // Если токен "протух" — разлогиниваем
          if (error.response && error.response.status === 401) {
             logout();
          }
        }
      }
      setLoading(false);
    };
    
    checkLoggedIn();
  }, [API_BASE]);

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
      {!loading ? children : <div className="loading-screen">Loading...</div>}
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