import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  HiOutlineLogout, 
  HiOutlineShoppingBag, 
  HiOutlineClock, 
  HiOutlineHeart,
  HiOutlineCurrencyDollar 
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

  // Динамический URL бэкенда из переменных окружения
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sneakerhub-vsiq.onrender.com';

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        navigate('/login');
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const [ordersRes, wishlistRes] = await Promise.all([
          axios.get(`${API_BASE}/api/orders/my-orders`, config),
          axios.get(`${API_BASE}/api/auth/wishlist`, config)
        ]);
        setOrders(ordersRes.data);
        setWishlist(wishlistRes.data);
      } catch (err) {
        console.error("Error loading profile data:", err);
        toast.error("Failed to fetch profile updates 🔄");
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        // Меняем loading(false) на ФУНКЦИЮ-сеттер:
        setLoading(false); 
      }
    };
   fetchData();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, logout, API_BASE]);

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully. See you soon! 👋");
    navigate('/');
  };

  const handleAddToCart = (product) => {
    toast.success(`${product.title} (Size: ${product.size}) added to cart! 👟`);
    console.log("Added to cart from profile:", product);
  };

  // Динамическое приветствие на английском
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'GOOD MORNING';
    if (hour >= 12 && hour < 18) return 'GOOD AFTERNOON';
    if (hour >= 18 && hour < 23) return 'GOOD EVENING';
    return 'GOOD NIGHT';
  };

  // Подсчет потраченных денег (только успешные заказы)
  const totalSpent = orders
    .filter(o => o.status === 'Completed' || o.status === 'Delivered')
    .reduce((sum, order) => sum + order.totalPrice, 0);

  // Динамический расчет статуса Лояльности (Tier)
  const getLoyaltyTier = (spent) => {
    if (spent >= 500) return { name: 'ELITE VIP 👑', color: '#ffd700', bg: '#fffde7' };
    if (spent >= 200) return { name: 'SNEAKERHEAD', color: '#ff4757', bg: '#fff5f5' };
    return { name: 'ROOKIE', color: '#888', bg: '#f8f9fa' };
  };

  const currentTier = getLoyaltyTier(totalSpent);

  // Улучшенная динамическая стилизация статусов заказов
  const getStatusStyle = (status) => {
    const currentStatus = status?.toLowerCase() || 'pending';
    if (currentStatus === 'completed' || currentStatus === 'delivered') {
      return { color: '#00c853', background: '#e8f5e9' };
    }
    if (currentStatus === 'cancelled' || currentStatus === 'failed') {
      return { color: '#ff4d4d', background: '#ffebee' };
    }
    return { color: '#ff9100', background: '#fff3e0' };
  };

  if (loading) return <div style={styles.loader}>Loading your sneakers... 🚀</div>;

  return (
    <div style={styles.container}>
      {/* Стили для интерактивности и микро-анимаций */}
      <style>{`
        .premium-card {
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .premium-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06) !important;
          border-color: #000 !important;
        }
        .tg-btn-anim {
          transition: all 0.25s ease !important;
        }
        .tg-btn-anim:hover {
          background-color: #0077b5 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);
        }
        @keyframes pulse-live {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 200, 83, 0.5); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(0, 200, 83, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 200, 83, 0); }
        }
        .live-dot {
          animation: pulse-live 2s infinite;
        }
      `}</style>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.welcome}>{getGreeting()}, {user?.name?.toUpperCase() || 'SNEAKERHEAD'}!</h1>
          <p style={styles.email}>{user?.email}</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} className="premium-card">
          <HiOutlineLogout size={20} /> LOG OUT
        </button>
      </div>

      {/* INTERACTIVE TELEGRAM BANNER */}
      {user?.telegramId ? (
        /* Если Telegram уже подключен */
        <div style={styles.tgBannerLinked}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="live-dot" style={styles.glowingDot}></div>
            <div>
              <h3 style={styles.tgLinkedTitle}>Telegram Notifications Active</h3>
              <p style={styles.tgLinkedText}>Live tracking, order updates, and premium drop alerts are fully operational.</p>
            </div>
          </div>
        </div>
      ) : (
        /* Если Telegram НЕ подключен */
        <div style={styles.tgBannerUnlinked}>
          <div style={styles.tgBannerLeft}>
            <div style={styles.tgIconWrapper}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L2 10.5L9.5 14.5L13.5 22L22 2Z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 style={styles.tgUnlinkedTitle}>Never Miss a Drop & Order Update</h3>
              <p style={styles.tgUnlinkedText}>Connect your Telegram account to receive instantaneous receipt details, live shipping statuses, and fast-lane restock alerts.</p>
            </div>
          </div>
          <a 
            href={`https://t.me/sneakerhub_orders_bot?start=${user?._id || ''}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="tg-btn-anim"
            style={styles.tgBtn}
          >
            Connect Telegram
          </a>
        </div>
      )}

      {/* STATS */}
      <div style={styles.statsRow}>
        <div className="premium-card" style={styles.statCard}>
          <HiOutlineShoppingBag size={24} color="#000" />
          <span>Orders: <strong>{orders.length}</strong></span>
        </div>
        <div className="premium-card" style={styles.statCard}>
          <HiOutlineHeart size={24} color="#ff4757" />
          <span>Wishlist: <strong>{wishlist.length}</strong></span>
        </div>
        <div className="premium-card" style={styles.statCard}>
          <HiOutlineCurrencyDollar size={24} color="#00c853" />
          <span>Total Spent: <strong>${totalSpent.toFixed(2)}</strong></span>
        </div>
        <div className="premium-card" style={{ ...styles.statCard, background: currentTier.bg, borderColor: currentTier.color + '33' }}>
          <HiOutlineClock size={24} color={currentTier.color} />
          <span>Status: <strong style={{ color: currentTier.color === '#888' ? '#000' : currentTier.color }}>{currentTier.name}</strong></span>
        </div>
      </div>

      {/* WISHLIST SECTION */}
      <h2 style={styles.sectionTitle}>MY WISHLIST</h2>
      {wishlist.length === 0 ? (
        <p style={styles.emptyText}>Your wishlist is currently empty.</p>
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
      <h2 style={{ ...styles.sectionTitle, marginTop: '50px' }}>ORDER HISTORY</h2>
      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <p>Your history is empty. Your first exclusive pair is waiting for you in the shop!</p>
          <button onClick={() => navigate('/')} style={styles.shopBtn}>GO SHOPPING</button>
        </div>
      ) : (
        <div style={styles.ordersList}>
          {orders.map((order) => (
            <div key={order._id} className="premium-card" style={styles.orderCard}>
              <div style={styles.orderLeft}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <div style={styles.orderId}>ORDER #{order._id.slice(-6).toUpperCase()}</div>
                  <div style={styles.dividerDot}>•</div>
                  <div style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                <div style={styles.itemsList}>
                  {order.items.map((item, idx) => (
                    <span key={idx} style={styles.itemTag}>
                      {item.title} <span style={{ color: '#888', fontWeight: 'normal' }}>({item.size})</span>
                    </span>
                  ))}
                </div>
              </div>
              <div style={styles.orderRight}>
                <div style={styles.totalPrice}>${order.totalPrice.toFixed(2)}</div>
                <div style={{
                  ...styles.status,
                  ...getStatusStyle(order.status)
                }}>
                  {(order.status || 'PROCESSING').toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCT DETAILS MODAL */}
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
  loader: { padding: '100px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', fontFamily: "'Montserrat', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  welcome: { fontWeight: '900', fontSize: '32px', letterSpacing: '-1px', margin: 0 },
  email: { color: '#888', margin: '5px 0 0 0', fontSize: '14px' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: '1px solid #eee', background: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  
  // TELEGRAM БАННЕРЫ
  tgBannerUnlinked: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '24px', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' },
  tgBannerLeft: { display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 500px' },
  tgIconWrapper: { background: '#0088cc', color: '#fff', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tgUnlinkedTitle: { margin: 0, fontSize: '16px', fontWeight: '800', color: '#0369a1', letterSpacing: '-0.3px' },
  tgUnlinkedText: { margin: '4px 0 0 0', fontSize: '13px', color: '#0ea5e9', lineHeight: '1.5', fontWeight: '500' },
  tgBtn: { background: '#0088cc', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', display: 'inline-block', border: 'none', cursor: 'pointer', textAlign: 'center' },
  
  tgBannerLinked: { padding: '20px 25px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '24px', marginBottom: '40px' },
  glowingDot: { width: '10px', height: '10px', background: '#00c853', borderRadius: '50%', display: 'inline-block' },
  tgLinkedTitle: { margin: 0, fontSize: '15px', fontWeight: '800', color: '#166534' },
  tgLinkedText: { margin: '2px 0 0 0', fontSize: '13px', color: '#22c55e', fontWeight: '500' },

  // СТАТИСТИКА
  statsRow: { display: 'flex', gap: '15px', marginBottom: '50px', flexWrap: 'wrap' },
  statCard: { flex: '1 1 200px', padding: '20px', background: '#f8f9fa', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '15px', border: '1px solid #f0f0f0' },
  sectionTitle: { fontSize: '20px', fontWeight: '800', marginBottom: '25px', letterSpacing: '1px', textTransform: 'uppercase' },
  emptyText: { color: '#888', fontSize: '14px' },
  emptyState: { padding: '60px', background: '#f8f9fa', borderRadius: '25px', textAlign: 'center', color: '#888' },
  shopBtn: { marginTop: '20px', padding: '15px 30px', background: '#000', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' },
  
  // ЗАКАЗЫ
  ordersList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  orderCard: { padding: '24px', border: '1px solid #f0f0f0', background: '#fff', borderRadius: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' },
  orderId: { fontWeight: '900', fontSize: '14px', color: '#111', letterSpacing: '0.5px' },
  dividerDot: { color: '#ccc', fontWeight: 'bold', fontSize: '14px' },
  orderDate: { fontSize: '13px', color: '#888' },
  itemsList: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' },
  itemTag: { background: '#f4f4f5', color: '#18181b', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: '1px solid #e4e4e7' },
  orderRight: { textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' },
  totalPrice: { fontWeight: '900', fontSize: '24px', color: '#000', letterSpacing: '-0.5px' },
  status: { padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' }
};

export default Profile;