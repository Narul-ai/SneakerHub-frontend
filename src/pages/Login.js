import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    // Формируем данные: при входе шлем только email и password
    const requestData = isLogin 
      ? { email: formData.email, password: formData.password } 
      : formData;

    try {
      // Лог для отладки — увидишь в консоли браузера, что именно улетает
      console.log(`Отправка на ${endpoint}:`, requestData);

      const { data } = await axios.post(`http://https://sneakerhub-vsiq.onrender.com:5000${endpoint}`, requestData);
      
      // Сохраняем данные в контекст (токен и юзера)
      login(data.user, data.token);
      
      toast.success(`Добро пожаловать, ${data.user.name}! 😊`);
      
      // Редирект
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      // Выводим полную ошибку в консоль, чтобы понять причину 401
      console.error("Ошибка запроса:", err.response?.data);
      
      const errorMessage = err.response?.data?.message || 'Ошибка. Проверьте данные.';
      toast.error(errorMessage);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isLogin ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}</h2>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <input 
              name="name"
              type="text" 
              placeholder="Имя" 
              style={styles.input}
              value={formData.name}
              onChange={handleChange} 
              required
            />
          )}
          
          <input 
            name="email" 
            type="email" 
            placeholder="Email" 
            style={styles.input}
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <input 
            name="password" 
            type="password" 
            placeholder="Пароль" 
            style={styles.input}
            value={formData.password}
            onChange={handleChange}
            required
          />
          
          <button type="submit" style={styles.button}>
            {isLogin ? 'ВОЙТИ' : 'СОЗДАТЬ АККАУНТ'}
          </button>
        </form>
        
        <p style={styles.toggleText} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Нет аккаунта? Зарегистрируйся' : 'Уже есть аккаунт? Войди'}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { 
    height: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: '#f5f5f7',
    fontFamily: "'Montserrat', sans-serif"
  },
  card: { 
    background: '#fff', 
    padding: '40px', 
    borderRadius: '30px', 
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)', 
    width: '100%', 
    maxWidth: '400px', 
    textAlign: 'center' 
  },
  title: { 
    fontWeight: '900', 
    letterSpacing: '-1px', 
    marginBottom: '30px', 
    color: '#000', 
    fontSize: '28px' 
  },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { 
    padding: '15px', 
    borderRadius: '12px', 
    border: '1px solid #f0f0f0', 
    background: '#f9f9fb', 
    fontSize: '16px', 
    outline: 'none', 
    transition: '0.3s',
    fontFamily: 'inherit'
  },
  button: { 
    padding: '15px', 
    borderRadius: '12px', 
    border: 'none', 
    background: '#000', 
    color: '#fff', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    marginTop: '10px', 
    fontSize: '16px',
    transition: '0.3s'
  },
  toggleText: { 
    marginTop: '20px', 
    fontSize: '14px', 
    color: '#888', 
    cursor: 'pointer', 
    fontWeight: '500' 
  }
};

export default Login;