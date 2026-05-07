import React, { useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { HiPlus, HiMinus, HiOutlineTrash } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti'; // Импорт конфетти

function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, totalPrice, clearCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token || !user) {
      toast.warn("Сначала войдите в аккаунт! 😊");
      navigate('/login');
      return;
    }

    setIsCheckingOut(true);
    try {
      const orderItems = cart.map(item => ({
        product: item._id,
        title: item.title,
        quantity: item.quantity || 1,
        price: item.price,
        size: item.size || "Уточнить",
        image: item.image || ""
      }));

      await axios.post('https://sneakerhub-vsiq.onrender.com/api/orders', {
        items: orderItems,
        totalPrice: totalPrice,
        shippingInfo: {
          customerName: user.name,
          phoneNumber: user.phoneNumber || "Не указан",
          address: "Указано в профиле",
          city: "Алматы"
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // --- ЗАПУСК КОНФЕТТИ ---
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000000', '#ff4757', '#ffffff']
      });

      setTimeout(() => {
        confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } });
      }, 500);
      // -----------------------

      toast.success(`Заказ оформлен! 🚀`, { theme: "dark" });
      clearCart();
      
      setTimeout(() => navigate('/profile'), 1500);

    } catch (error) {
      console.error("Ошибка заказа:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || "Ошибка при оформлении";
      toast.error(errorMsg);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="cart-panel" style={{ 
      flex: '1 1 350px', 
      background: 'white', 
      padding: '25px', 
      borderRadius: '24px', 
      height: 'fit-content', 
      boxShadow: '0 20px 40px rgba(0,0,0,0.08)', 
      position: 'sticky', 
      top: '20px',
      border: '1px solid #f0f0f0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontWeight: '900', fontSize: '18px', letterSpacing: '-0.5px' }}>ВАША КОРЗИНА</h3>
        <span style={{ fontSize: '12px', background: '#eee', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
          {cart.length} ПРЕДМ.
        </span>
      </div>
      
      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
          <p style={{ color: '#aaa', fontSize: '14px' }}>Пока тут пусто, выберите что-нибудь крутое!</p>
        </div>
      ) : (
        <>
          <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
            {cart.map((item) => (
              <div key={`${item._id}-${item.size}`} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                padding: '15px 0', 
                borderBottom: '1px solid #f5f5f5' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                   <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a1a' }}>{item.title}</div>
                   <div style={{ fontWeight: '900', color: '#00c853' }}>${(item.price * (item.quantity || 1)).toFixed(2)}</div>
                </div>
                
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                  Размер: <span style={{ color: '#000', fontWeight: 'bold' }}>{item.size || '—'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    background: '#f8f8f8', 
                    padding: '5px 12px', 
                    borderRadius: '10px',
                    border: '1px solid #eee'
                  }}>
                    <button 
                      className="quantity-btn"
                      onClick={() => updateQuantity(item._id, item.size, -1)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#555' }}
                    >
                      <HiMinus size={14} />
                    </button>
                    
                    <span style={{ fontWeight: '800', fontSize: '14px', minWidth: '15px', textAlign: 'center' }}>
                      {item.quantity || 1}
                    </span>
                    
                    <button 
                      className="quantity-btn"
                      onClick={() => updateQuantity(item._id, item.size, 1)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#555' }}
                    >
                      <HiPlus size={14} />
                    </button>
                  </div>

                  <button 
                    className="delete-btn"
                    onClick={() => removeFromCart(item._id, item.size)} 
                    style={{ 
                      border: 'none', 
                      background: '#fff5f5', 
                      color: '#ff4d4d', 
                      cursor: 'pointer', 
                      padding: '8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <HiOutlineTrash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '2px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontWeight: '600', color: '#888' }}>ИТОГО К ОПЛАТЕ:</span>
              <strong style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' }}>
                ${totalPrice.toFixed(2)}
              </strong>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={isCheckingOut}
              style={{ 
                width: '100%', 
                padding: '20px', 
                background: isCheckingOut ? '#ccc' : '#000', 
                color: 'white', 
                border: 'none', 
                borderRadius: '18px', 
                fontWeight: '900', 
                fontSize: '16px',
                cursor: isCheckingOut ? 'not-allowed' : 'pointer',
                boxShadow: isCheckingOut ? 'none' : '0 10px 25px rgba(0,0,0,0.15)',
                transition: 'all 0.2s'
              }}
            >
              {isCheckingOut ? 'ОБРАБОТКА...' : 'ОФОРМИТЬ ЗАКАЗ'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;