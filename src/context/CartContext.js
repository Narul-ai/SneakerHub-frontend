import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast'; 

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('sneaker_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('sneaker_cart', JSON.stringify(cart));
  }, [cart]);

  const totalPrice = cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  const totalSavings = cart.reduce((acc, item) => {
      const savings = item.oldPrice ? (item.oldPrice - item.price) * (item.quantity || 1) : 0;
      return acc + savings;
  }, 0);

  const addToCart = (product) => {
    if (!product.size) {
      toast.error("Please select a size!");
      return;
    }

    setCart(prev => {
      const existingItemIndex = prev.findIndex(
        item => {
          const sameId = (item._id && item._id === product._id) || (item.id && item.id === product.id);
          const sameSize = item.size === product.size;
          return sameId && sameSize;
        }
      );

      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: (newCart[existingItemIndex].quantity || 1) + 1
        };
        
        toast("Quantity updated!", {
          icon: '🔄',
        });
        
        return newCart;
      }

      toast.success(`${product.title} added! 👟`);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId, size) => {
    setCart(prev => prev.filter(item => !(item._id === productId && item.size === size)));
    toast.success('Removed from cart');
  };

  const updateQuantity = (productId, size, amount) => {
    setCart(prev => prev.map(item => 
      (item._id === productId && item.size === size) 
      ? { ...item, quantity: Math.max(1, (item.quantity || 1) + amount) } 
      : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('sneaker_cart');
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      totalPrice, 
      totalSavings 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};