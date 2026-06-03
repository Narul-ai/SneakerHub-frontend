import React, { useState, useEffect } from 'react';
import { 
  HiOutlineX, 
  HiOutlineShoppingBag, 
  HiChevronLeft, 
  HiChevronRight, 
  HiStar, 
  HiOutlineChatAlt,
  HiOutlineTrash,
  HiOutlineShare 
} from 'react-icons/hi';
import './ProductModal.css';
import { useAuth } from '../context/AuthContext';

function ProductModal({ product, onClose, onAddToCart }) {
  const auth = useAuth(); 
  const user = auth?.user || null; 

  // Базовый URL бэкенда из переменных окружения
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

  const [currentImg, setCurrentImg] = useState(0);
  const availableSizes = product?.sizes || [39, 40, 41, 42, 43, 44];
  const [selectedSize, setSelectedSize] = useState(availableSizes[0]);
  
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [localReviews, setLocalReviews] = useState([]);

  useEffect(() => {
    if (product) {
      setIsLoadingReviews(true);
      setLocalReviews(product.reviews || []);
      const timer = setTimeout(() => setIsLoadingReviews(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [product]);

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const nextImg = () => setCurrentImg((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const prevImg = () => setCurrentImg((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  const copyProductLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/product/${product._id}`);
    alert("Ссылка на кроссовки скопирована в буфер обмена!");
  };

  const submitReviewHandler = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert("Вы не авторизованы!");
      return;
    }

    if (!comment.trim()) {
      alert("Напишите текст отзыва");
      return;
    }

    setIsSubmitting(true);
    try {
      // ИСПРАВЛЕНО: Добавлен полный путь к бэкенду Render через API_BASE
      const response = await fetch(`${API_BASE}/api/products/${product._id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: newRating,
          comment: comment
        })
      });

      // 1. Сначала проверяем статус ответа сервера
      if (!response.ok) {
        let errorMessage = `Ошибка сервера: ${response.status}`;
        try {
          // Пытаемся прочитать JSON с ошибкой, если бэкенд его прислал
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (_) {
          // Если там не JSON (например, пустой ответ или HTML при 405), игнорируем ошибку парсинга
        }
        alert(errorMessage);
        return; // Останавливаем выполнение функции
      }

      // 2. Если дошли сюда, значит response.ok === true. Безопасно парсим JSON
      const data = await response.json();

      alert("Отзыв успешно добавлен!");
      
      const newReviewObj = data.review || {
        _id: Date.now().toString(),
        user: user?._id,
        name: user?.name || 'Пользователь',
        rating: newRating,
        comment: comment,
        createdAt: new Date().toISOString()
      };
      
      setLocalReviews([newReviewObj, ...localReviews]);
      setComment('');
      setNewRating(5);

    } catch (error) {
      console.error("Ошибка отправки отзыва:", error);
      alert("Не удалось отправить отзыв. Проверьте соединение.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReviewHandler = async (reviewId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот отзыв?")) return;

    const token = localStorage.getItem('token');
    try {
      // ИСПРАВЛЕНО: Добавлен полный путь к бэкенду Render через API_BASE
      const response = await fetch(`${API_BASE}/api/products/${product._id}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Сначала проверяем успешность ответа, чтобы не падать на json()
      if (!response.ok) {
        alert(`Ошибка при удалении: статус ${response.status}`);
        return;
      }

      const data = await response.json();

      alert("Отзыв удален");
      setLocalReviews(localReviews.filter(rev => rev._id !== reviewId));
    } catch (error) {
      console.error("Ошибка удаления:", error);
      alert("Не удалось удалить отзыв");
    }
  };

  const getAvatarStyle = (name = "U") => {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FFB833', '#33FFF6'];
    const charCode = name.charCodeAt(0);
    const color = colors[charCode % colors.length];
    return {
      backgroundColor: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 'bold',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      fontSize: '14px',
      flexShrink: 0
    };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* КНОПКА ЗАКРЫТИЯ */}
        <button className="close-button" onClick={onClose} aria-label="Close">
          <HiOutlineX size={28} />
        </button>

        {/* ФИКС: Кнопка "Поделиться" теперь вынесена отдельно, чтобы не мешать "X" */}
        <button 
          className="share-modal-btn"
          onClick={copyProductLink}
          title="Поделиться товаром"
          style={{
            position: 'absolute',
            top: '60px', // Опускаем ниже кнопки X
            right: '20px',
            background: 'white',
            border: '1px solid #eee',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        >
          <HiOutlineShare size={20} color="#333" />
        </button>
        
        <div className="modal-body">
          <div className="modal-image-section">
            <div className="modal-main-img-container">
              <img src={images[currentImg]} alt={product.title} className="modal-img" />
              {images.length > 1 && (
                <>
                  <button className="modal-nav left" onClick={prevImg}><HiChevronLeft /></button>
                  <button className="modal-nav right" onClick={nextImg}><HiChevronRight /></button>
                </                >
              )}
            </div>
            
            <div className="modal-thumbnails">
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`thumb ${idx === currentImg ? 'active' : ''}`}
                  onClick={() => setCurrentImg(idx)}
                >
                  <img src={img} alt="thumbnail" />
                </div>
              ))}
            </div>
          </div>

          <div className="modal-info">
            <div className="modal-header-info">
              <span className="modal-brand">{product.brand || 'Premium Brand'}</span>
              <h2 className="modal-title">{product.title}</h2>
              <div className="modal-price-row">
                <span className="modal-current-price">${product.price}</span>
                {product.oldPrice > 0 && <span className="modal-old-price">${product.oldPrice}</span>}
              </div>
            </div>

            <div className="modal-section">
              <div className="section-header">
                <h4>ВЫБЕРИТЕ РАЗМЕР (EU)</h4>
                <span className="size-guide">Таблица размеров</span>
              </div>
              <div className="modal-size-grid">
                {availableSizes.map(size => (
                  <button 
                    key={size}
                    className={`modal-size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-desc-box">
              <h4>О ТОВАРЕ</h4>
              <p>{product.description || "Лимитированная серия кроссовок с улучшенной амортизацией."}</p>
            </div>

            <button 
              className="modal-action-btn"
              disabled={product.countInStock === 0}
              onClick={() => {
                if (typeof onAddToCart === 'function') {
                  onAddToCart({ ...product, size: selectedSize });
                  onClose();
                } else {
                  console.error("Ошибка: функция onAddToCart не передана в модалку!");
                  alert("Проблема с добавлением в корзину. Проверьте консоль.");
                }
              }}
            >
              <HiOutlineShoppingBag size={20} style={{ marginRight: '10px' }} />
              {product.countInStock > 0 ? 'ДОБАВИТЬ В КОРЗИНУ' : 'НЕТ В НАЛИЧИИ'}
            </button>

            <div className="review-section">
              <h3 className="review-title">
                <HiOutlineChatAlt size={20} /> ОТЗЫВЫ ({localReviews.length})
              </h3>

              <div className="add-review-minimal">
                <div className="star-picker">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <HiStar 
                      key={s}
                      className={s <= newRating ? "star active" : "star"} 
                      onClick={() => setNewRating(s)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </div>
                <div className="input-group">
                  <input 
                    type="text" 
                    placeholder={isSubmitting ? "Отправка..." : "Напишите отзыв..."}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <button 
                    className="send-rev-btn" 
                    onClick={submitReviewHandler}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "..." : "ОТПРАВИТЬ"}
                  </button>
                </div>
              </div>

              <div className="reviews-list">
                {isLoadingReviews ? (
                  [1, 2].map(i => (
                    <div key={i} className="review-skeleton">
                      <div className="skeleton-avatar"></div>
                      <div className="skeleton-content" style={{ flex: 1 }}>
                        <div className="skeleton-line short"></div>
                        <div className="skeleton-line long"></div>
                      </div>
                    </div>
                  ))
                ) : localReviews.length > 0 ? (
                  localReviews.map((rev) => (
                    <div key={rev._id} className="review-card">
                      <div style={getAvatarStyle(rev.name)}>
                        {rev.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="review-main" style={{ flex: 1 }}>
                        <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span className="review-user">{rev.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="review-date">
                              {new Date(rev.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                            
                            {(user?._id === rev.user || user?.role === 'admin') && (
                              <HiOutlineTrash 
                                size={16} 
                                color="#ff4d4d" 
                                style={{ cursor: 'pointer' }} 
                                onClick={() => deleteReviewHandler(rev._id)}
                                title="Удалить отзыв"
                              />
                            )}
                          </div>
                        </div>
                        <div className="review-stars">
                          {[...Array(5)].map((_, i) => (
                            <HiStar key={i} color={i < rev.rating ? "#FFB800" : "#E0E0E0"} size={12} />
                          ))}
                        </div>
                        <p className="review-text">{rev.comment}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-reviews" style={{ color: '#888', fontSize: '13px' }}>Здесь пока пусто. Станьте первым!</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;