import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Контексты
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';

// Компоненты и страницы
import MainShop from './MainShop'; 
import Admin from './Admin'; 
import Profile from './pages/Profile'; 
import Login from './pages/Login'; 
import ProtectedRoute from './components/ProtectedRoute'; 
import ProductModal from './components/ProductModal';

// Иконки
import { HiOutlineShoppingBag, HiOutlineCog, HiOutlineLogout, HiOutlineUser, HiOutlineLogin } from 'react-icons/hi';

// Вспомогательный компонент навигации
const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const isAdmin = user?.role === 'admin';

  const [isBumping, setIsBumping] = useState(false);
  
  // Добавляем состояние для отслеживания ширины экрана в реальном времени
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 850; // Точка перехода как в твоей модалке

  useEffect(() => {
    if (cart.length === 0) return;
    setIsBumping(true);
    const timer = setTimeout(() => {
      setIsBumping(false);
    }, 400); 
    return () => clearTimeout(timer);
  }, [cart.length]);

  // Вычисляем стили динамически
  const dynamicStyles = {
    nav: { 
      padding: isMobile ? '15px 15px' : '20px 5%', 
      background: '#000', 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexWrap: 'nowrap', // Запрещаем перенос корзины
      width: '100%',
      boxSizing: 'border-box'
    },
    navLeft: { 
      display: 'flex', 
      gap: isMobile ? '12px' : '30px', 
      alignItems: 'center' 
    },
    navRight: { 
      display: 'flex', 
      gap: isMobile ? '10px' : '25px', 
      alignItems: 'center' 
    },
    navLink: { 
      color: '#fff', 
      textDecoration: 'none', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '6px', 
      fontWeight: 'bold',
      fontSize: isMobile ? '11px' : '13px', 
      letterSpacing: '0.5px'
    },
    cartBadge: { 
      color: '#fff', 
      fontSize: isMobile ? '10px' : '12px', 
      background: '#222', 
      padding: isMobile ? '5px 10px' : '6px 12px', 
      borderRadius: '20px',
      transition: 'transform 0.1s ease-in-out', 
      display: 'inline-block',
      whiteSpace: 'nowrap'
    },
    logoutBtn: { 
      background: 'none', 
      border: 'none', 
      color: '#ff4d4d', 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '4px', 
      fontWeight: 'bold', 
      fontSize: isMobile ? '11px' : '13px'
    }
  };

  return (
    <nav style={dynamicStyles.nav}>
      <div style={dynamicStyles.navLeft}>
        <Link to="/" style={dynamicStyles.navLink}>
          <HiOutlineShoppingBag size={isMobile ? 18 : 20} /> SHOP
        </Link>
        
        {isAuthenticated && (
          <Link to="/profile" style={dynamicStyles.navLink}>
            <HiOutlineUser size={isMobile ? 18 : 20} /> {isMobile ? 'ME' : 'PROFILE'}
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin" style={{ ...dynamicStyles.navLink, color: '#00c853' }}>
            <HiOutlineCog size={isMobile ? 18 : 20} /> {isMobile ? 'ADM' : 'ADMIN'}
          </Link>
        )}
      </div>

      <div style={dynamicStyles.navRight}>
        <div className={isBumping ? 'bump' : ''} style={dynamicStyles.cartBadge}>
          {isMobile ? '' : 'CART: '}<strong>{cart.length}</strong>
        </div>
        
        {isAuthenticated ? (
          <button onClick={logout} style={dynamicStyles.logoutBtn}>
            <HiOutlineLogout size={isMobile ? 18 : 20} /> {isMobile ? 'OUT' : 'LOGOUT'}
          </button>
        ) : (
          <Link to="/login" style={dynamicStyles.navLink}>
            <HiOutlineLogin size={isMobile ? 18 : 20} /> LOGIN
          </Link>
        )}
      </div>
    </nav>
  );
};

// --- НОВЫЙ КОМПОНЕНТ ДЛЯ ЛОГИКИ ПРОВЕРКИ ---
const AuthChecker = ({ children }) => {
  const { setUser } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error("Auth check failed", error);
        }
      }
    };
    checkAuth();
  }, [setUser]);

  return children;
};

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <AuthProvider>
      <AuthChecker>
        <CartProvider>
          <Router>
            <div className="app-container">
              <Navbar />
              
              <Routes>
                <Route path="/" element={
                  <MainShop onShowDetails={(product) => setSelectedProduct(product)} />
                } />
                
                <Route path="/login" element={<Login />} />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                <Route path="/admin" element={
                  <ProtectedRoute adminOnly={true}>
                    <Admin />
                  </ProtectedRoute>
                } />
              </Routes>

              {selectedProduct && (
                <ProductModal 
                  product={selectedProduct} 
                  onClose={() => setSelectedProduct(null)} 
                />
              )}

              <ToastContainer position="bottom-right" theme="dark" />
            </div>
          </Router>
        </CartProvider>
      </AuthChecker>
    </AuthProvider>
  );
}

export default App;