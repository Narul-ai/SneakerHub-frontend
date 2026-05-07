import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineLogout, 
  HiOutlineShoppingBag, 
  HiOutlineClock, 
  HiOutlineHeart,
  HiOutlineCurrencyDollar // Добавлена новая иконка для статистики
} from 'react-icons/hi';
import ProductModal from '../components/ProductModal';
import ProductCard from '../components/ProductCard';

function Profile() {
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const [ordersRes, wishlistRes] = await Promise.all([
          axios.get('https://sneakerhub-vsiq.onrender.com/api/orders/my-orders', config),
          axios.get('https://sneakerhub-vsiq.onrender.com/api/auth/wishlist', config)
        ]);
        setOrders(ordersRes.data);
        setWishlist(wishlistRes.data);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddToCart = (product) => {
    // Выводим адекватное уведомление пользователю
    alert(`Кроссовки ${product.title} (Размер: ${product.size}) добавлены в корзину!`);
    console.log("Добавлено в корзину из профиля:", product);
  };

  // Динамическое приветствие
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'ДОБРОЕ УТРО';
    if (hour >= 12 && hour < 18) return 'ДОБРЫЙ ДЕНЬ';
    if (hour >= 18 && hour < 23) return 'ДОБРЫЙ ВЕЧЕР';
    return 'ДОБРОЙ НОЧИ';
  };

  // Подсчет потраченных денег (только успешные заказы)
  const totalSpent = orders
    .filter(o => o.status === 'Completed' || o.status === 'Delivered')
    .reduce((sum, order) => sum + order.totalPrice, 0);

  if (loading) return <div style={styles.loader}>Загрузка твоих кроссовок...</div>;

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.welcome}>{getGreeting()}, {user?.name?.toUpperCase() || 'СНИКЕРХЕД'}!</h1>
          <p style={styles.email}>{user?.email}</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <HiOutlineLogout size={20} /> ВЫЙТИ
        </button>
      </div>

      {/* STATS */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <HiOutlineShoppingBag size={24} color="#000" />
          <span>Заказов: <strong>{orders.length}</strong></span>
        </div>
        <div style={styles.statCard}>
          <HiOutlineHeart size={24} color="#ff4757" />
          <span>В избранном: <strong>{wishlist.length}</strong></span>
        </div>
        {/* Новая карточка со статистикой трат */}
        <div style={styles.statCard}>
          <HiOutlineCurrencyDollar size={24} color="#00c853" />
          <span>Потрачено: <strong>${totalSpent.toFixed(2)}</strong></span>
        </div>
        <div style={styles.statCard}>
          <HiOutlineClock size={24} color="#ffa502" />
          <span>Статус: <strong>VIP</strong></span>
        </div>
      </div>

      {/* WISHLIST SECTION */}
      <h2 style={styles.sectionTitle}>МОЁ ИЗБРАННОЕ</h2>
      {wishlist.length === 0 ? (
        <p style={styles.emptyText}>Твой список желаний пуст.</p>
      ) : (
        <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}> 
          {wishlist.map((item) => (
            <ProductCard 
              key={item._id} 
              product={item} 
              onShowDetails={(p) => setSelectedProduct(p)} 
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {/* ORDERS SECTION */}
      <h2 style={{ ...styles.sectionTitle, marginTop: '50px' }}>ИСТОРИЯ ЗАКАЗОВ</h2>
      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <p>Пока здесь пусто. Твоя первая пара ждет тебя в магазине!</p>
          <button onClick={() => navigate('/')} style={styles.shopBtn}>ПЕРЕЙТИ К ПОКУПКАМ</button>
        </div>
      ) : (
        <div style={styles.ordersList}>
          {orders.map((order) => (
            <div key={order._id} style={styles.orderCard}>
              <div style={styles.orderLeft}>
                <div style={styles.orderId}>ЗАКАЗ #{order._id.slice(-6).toUpperCase()}</div>
                <div style={styles.orderDate}>{new Date(order.createdAt).toLocaleString()}</div>
                <div style={styles.itemsList}>
                  {order.items.map((item, idx) => (
                    <span key={idx} style={styles.itemTag}>
                      {item.title} ({item.size})
                    </span>
                  ))}
                </div>
              </div>
              <div style={styles.orderRight}>
                <div style={styles.totalPrice}>${order.totalPrice.toFixed(2)}</div>
                <div style={{
                  ...styles.status,
                  color: order.status === 'Completed' ? '#00c853' : '#ff9100',
                  background: order.status === 'Completed' ? '#e8f5e9' : '#fff3e0'
                }}>
                  {order.status || 'ОБРАБОТКА'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ТОВАРА */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}

const styles = {
  container: { padding: '60px 20px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Montserrat', sans-serif" },
  loader: { padding: '100px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' },
  welcome: { fontWeight: '900', fontSize: '32px', letterSpacing: '-1px', margin: 0 },
  email: { color: '#888', margin: '5px 0 0 0' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: '1px solid #eee', background: '#fff', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' },
  statsRow: { display: 'flex', gap: '15px', marginBottom: '40px', flexWrap: 'wrap' },
  statCard: { flex: '1 1 200px', padding: '20px', background: '#f8f9fa', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '15px', border: '1px solid transparent', transition: '0.3s' },
  sectionTitle: { fontSize: '20px', fontWeight: '800', marginBottom: '25px', letterSpacing: '1px', textTransform: 'uppercase' },
  emptyText: { color: '#888', fontSize: '14px' },
  emptyState: { padding: '60px', background: '#f8f9fa', borderRadius: '25px', textAlign: 'center', color: '#888' },
  shopBtn: { marginTop: '20px', padding: '15px 30px', background: '#000', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' },
  ordersList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  orderCard: { padding: '25px', border: '1px solid #f0f0f0', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.3s', flexWrap: 'wrap', gap: '20px' },
  orderId: { fontWeight: '900', fontSize: '14px', color: '#444' },
  orderDate: { fontSize: '13px', color: '#aaa', marginBottom: '10px' },
  itemsList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  itemTag: { background: '#f0f0f0', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
  orderRight: { textAlign: 'right' },
  totalPrice: { fontWeight: '900', fontSize: '22px', marginBottom: '5px' },
  status: { padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', display: 'inline-block' }
};

export default Profile;