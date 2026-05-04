import React, { useState } from 'react';
import axios from 'axios';
import { HiOutlinePlusSm, HiChevronLeft, HiChevronRight, HiHeart, HiOutlineHeart } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext'; // Импортируем наш хук авторизации
import './ProductCard.css';

function ProductCard({ product, onAddToCart, onShowDetails }) {
  const [currentImg, setCurrentImg] = useState(0);
  const { user, setUser } = useAuth(); // Получаем данные пользователя и функцию обновления

  // Проверяем, в избранном ли товар (сверяем ID)
  const isWishlisted = user?.wishlist?.some(id => id === product._id || id._id === product._id);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.image || 'https://via.placeholder.com/300'];

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // Логика переключения избранного
  const handleWishlist = async (e) => {
    e.stopPropagation(); // Чтобы не открывались детали товара при клике на сердце
    if (!user) {
      alert("Войдите в аккаунт, чтобы сохранять товары!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/auth/wishlist', 
        { productId: product._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Обновляем состояние пользователя в контексте (массив ID)
      setUser({ ...user, wishlist: res.data });
    } catch (err) {
      console.error("Ошибка при обновлении избранного:", err);
    }
  };

  const currentPrice = Number(product.price);
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : 0;
  const hasDiscount = oldPrice > currentPrice && oldPrice > 0;

  const availableSizes = Array.isArray(product.sizes) && product.sizes.length > 0 
    ? product.sizes 
    : [39, 40, 41, 42, 43, 44];
    
  const [selectedSize, setSelectedSize] = useState(availableSizes[0]);

  return (
    <div className={`product-card ${hasDiscount ? 'has-discount' : ''}`}>
      {/* Тэг скидки */}
      {hasDiscount && <div className="discount-tag">SALE</div>}

      {/* КНОПКА ИЗБРАННОГО */}
      <button className="wishlist-btn" onClick={handleWishlist}>
        {isWishlisted ? (
          <HiHeart size={22} color="#ff4757" />
        ) : (
          <HiOutlineHeart size={22} color="#000" />
        )}
      </button>
      
      <div className="product-card-top" onClick={() => onShowDetails(product)}>
        <div className="product-image-container">
          <img src={images[currentImg]} alt={product.title} loading="lazy" />

          {images.length > 1 && (
            <>
              <button className="slider-arrow left" onClick={prevSlide}>
                <HiChevronLeft size={20} />
              </button>
              <button className="slider-arrow right" onClick={nextSlide}>
                <HiChevronRight size={20} />
              </button>
              <div className="slider-dots">
                {images.map((_, idx) => (
                  <div key={idx} className={`dot ${idx === currentImg ? 'active' : ''}`} />
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="product-info-text">
          <p className="product-category">
            {product.category ? product.category.toUpperCase() : 'LIFESTYLE'}
          </p>
          <h3 className="product-title">{product.title}</h3>
        </div>
      </div>

      <div className="product-card-bottom">
        <div className="size-selector">
          {availableSizes.slice(0, 5).map(size => (
            <button 
              key={size} 
              className={`size-button ${selectedSize === size ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation(); 
                setSelectedSize(size);
              }}
            >
              {size}
            </button>
          ))}
        </div>

        <div className="price-row">
          <div className="price-stack">
            <span className="product-price">${currentPrice}</span>
            {hasDiscount && <span className="product-old-price">${oldPrice}</span>}
          </div>
          
          <button 
            className="add-to-cart-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart({ ...product, size: selectedSize });
            }}
          >
            <HiOutlinePlusSm size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;