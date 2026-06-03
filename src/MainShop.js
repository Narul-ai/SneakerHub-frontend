import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Icons
import { HiOutlineUser, HiOutlineSearch, HiChevronDown, HiOutlineAdjustments } from 'react-icons/hi';
import { toast } from 'react-toastify';

// Core Components
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import Cart from './components/Cart';
import SkeletonCard from './components/SkeletonCard';
import { useCart } from './context/CartContext';
import { useAuth } from './context/AuthContext';

function MainShop() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  // --- 1. RESPONSIVENESS LOGIC (WINDOW LISTENER) ---
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 850;
  const isSmallMobile = windowWidth < 500;

  // --- STATE MANAGEMENT ---
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeBrand, setActiveBrand] = useState(null); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [onlySale, setOnlySale] = useState(false);

  const brands = ["ADIDAS", "NIKE", "JORDAN", "PUMA", "REEBOK", "NEW BALANCE"];
  
  // Dynamic API Base URL from environment variables
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sneakerhub-vsiq.onrender.com';

  // Data Fetching
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(`${API_BASE}/api/products`);
        setProducts(data);
      } catch (error) {
        toast.error("Database connection failure 🌐");
      } finally {
        setTimeout(() => setIsLoading(false), 600);
      }
    };
    fetchProducts();
  }, [API_BASE]);

  // Smart Filtering Engine
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "ALL" || p.category?.toUpperCase() === activeCategory;
      const matchesPrice = p.price <= maxPrice;
      const matchesSale = onlySale ? (Number(p.oldPrice) > Number(p.price)) : true;
      const matchesBrand = !activeBrand || 
                           p.brand?.toUpperCase() === activeBrand || 
                           p.title.toUpperCase().includes(activeBrand);
      return matchesSearch && matchesCategory && matchesPrice && matchesSale && matchesBrand;
    });
  }, [products, searchTerm, activeCategory, maxPrice, onlySale, activeBrand]);

  const categories = useMemo(() => 
    ["ALL", ...new Set(products.map(p => p.category?.toUpperCase()).filter(Boolean))],
  [products]);

  // Helper to completely clean up user selection filters
  const handleResetAllFilters = () => {
    setSearchTerm("");
    setActiveCategory("ALL");
    setActiveBrand(null);
    setMaxPrice(1500);
    setOnlySale(false);
  };

  // --- 2. DYNAMIC STYLES AND INJECTIONS ---
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      .brand-item-ui:hover { background: rgba(0, 200, 83, 0.08) !important; color: #00c853 !important; }
      .brand-item-ui.active { background: #00c853 !important; color: #fff !important; }
      .brands-dropdown { display: none; opacity: 0; transform: translateY(10px); transition: all 0.25s ease-in-out; }
      .brands-parent:hover .brands-dropdown { display: block; opacity: 1; transform: translateY(0); }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const styles = {
    page: { 
      padding: isMobile ? '15px 3%' : '30px 5%', 
      backgroundColor: '#fcfcfc', 
      minHeight: '100vh', 
      fontFamily: 'Inter, sans-serif',
      overflowX: 'hidden'
    },
    header: { 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
 justifyContent: 'space-between',
      alignItems: 'center', 
      gap: isMobile ? '20px' : '0',
      marginBottom: '40px', 
      background: 'rgba(255,255,255,0.8)', 
      padding: isMobile ? '20px' : '20px 40px', 
      borderRadius: isMobile ? '20px' : '30px', 
      backdropFilter: 'blur(10px)', 
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.02)'
    },
    logoGroup: { cursor: 'pointer', textAlign: isMobile ? 'center' : 'left' },
    logoText: { margin: 0, fontSize: isMobile ? '22px' : '26px', fontWeight: '900', letterSpacing: '-1.5px' },
    logoSubtext: { margin: 0, fontSize: '9px', color: '#bbb', fontWeight: '800', letterSpacing: '2px', marginTop: '-4px' },
    
    headerActions: { 
      display: 'flex', 
      flexDirection: isSmallMobile ? 'column' : 'row',
      gap: isMobile ? '15px' : '25px',
      width: isMobile ? '100%' : 'auto'
    },
    searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center', flex: 1 },
    searchIcon: { 
      position: 'absolute', 
      left: '15px', 
      color: '#ccc',
      pointerEvents: 'none', 
      zIndex: 2
    },
    searchInput: { 
      padding: '14px 20px 14px 45px', 
      borderRadius: '18px', 
      border: 'none', 
      width: isMobile ? '100%' : '280px', 
      background: '#f5f5f5', 
      fontSize: '13px', 
      fontWeight: '600',
      outline: 'none',
      position: 'relative',
      zIndex: 1 
    },
    profileBtn: { 
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '14px 25px', 
      borderRadius: '18px', border: 'none', background: '#1a1a1a', color: '#fff', 
      fontWeight: '700', cursor: 'pointer', fontSize: '12px',
      width: isMobile ? '100%' : 'auto'
    },

    filterSection: { marginBottom: '40px' },
    categoryBar: { 
      display: 'flex', gap: '10px', marginBottom: '25px', 
      flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' 
    },
    brandParent: { position: 'relative' },
    catBtn: { 
      padding: isMobile ? '10px 20px' : '12px 28px', borderRadius: '15px', border: 'none', 
      fontWeight: '700', fontSize: isMobile ? '10px' : '11px', cursor: 'pointer', 
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)', whiteSpace: 'nowrap'
    },

    dropdown: {
      position: 'absolute', top: '120%', left: isMobile ? '50%' : 0, 
      transform: isMobile ? 'translateX(-50%)' : 'none', width: '220px',
      backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(15px)',
      borderRadius: '20px', padding: '10px', zIndex: 2000,
      boxShadow: '0 30px 60px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.5)'
    },
    dropdownItem: {
      padding: '12px 18px', fontSize: '12px', fontWeight: '800', cursor: 'pointer',
      borderRadius: '12px', transition: '0.2s', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', color: '#333'
    },
    resetBrand: {
      marginTop: '10px', padding: '12px', textAlign: 'center', fontSize: '10px',
      fontWeight: '900', color: '#ff4757', borderTop: '1px solid #eee', cursor: 'pointer'
    },

    controlsBox: { 
      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', 
      background: '#fff', padding: '20px 30px', borderRadius: '24px',
      border: '1px solid #f0f0f0', gap: isMobile ? '20px' : '0'
    },
    priceControl: { 
      display: 'flex', flexDirection: isSmallMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center', gap: '20px', flex: 1 
    },
    controlLabel: { fontSize: '11px', fontWeight: '800', color: '#888' },
    rangeInput: { flex: 0.5, accentColor: '#00c853', width: '100%' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' },

    mainGrid: { 
      display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', 
      gap: isMobile ? '30px' : '40px' 
    },
    gridHeader: { marginBottom: '20px', display: 'flex', alignItems: 'center' },
    resultsTitle: { fontSize: isMobile ? '18px' : '22px', fontWeight: '900', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '15px', margin: 0 },
    countBadge: { background: '#eee', padding: '4px 12px', borderRadius: '10px', fontSize: '12px', color: '#999' },
    productsGrid: { 
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
      gap: isMobile ? '20px' : '30px', flex: 1 
    },
    sidebar: { 
      width: isMobile ? '100%' : '380px', position: isMobile ? 'static' : 'sticky', 
      top: '30px', alignSelf: 'flex-start' 
    }
  };

  return (
    <div style={styles.page}>
      
      <header style={styles.header}>
        <div onClick={() => navigate('/')} style={styles.logoGroup}>
          <h1 style={styles.logoText}>SNEAKER<span style={{ color: '#00c853' }}>HUB</span></h1>
          <p style={styles.logoSubtext}>PREMIUM FOOTWEAR SOLUTIONS</p>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.searchWrapper}>
            <HiOutlineSearch style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search current drops..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <button onClick={() => navigate(isAuthenticated ? '/profile' : '/login')} style={styles.profileBtn}>
            <HiOutlineUser size={18} />
            <span>{isAuthenticated ? user?.name?.split(' ')[0] : 'LOG IN'}</span>
          </button>
        </div>
      </header>

      <section style={styles.filterSection}>
        <div style={styles.categoryBar}>
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => { setActiveCategory(cat); setActiveBrand(null); }} 
              style={{
                ...styles.catBtn,
                backgroundColor: activeCategory === cat && !activeBrand ? '#1a1a1a' : '#fff',
                color: activeCategory === cat && !activeBrand ? '#fff' : '#1a1a1a',
              }}
            >
              {cat}
            </button>
          ))}

          <div className="brands-parent" style={styles.brandParent}>
            <button style={{
              ...styles.catBtn,
              backgroundColor: activeBrand ? '#00c853' : '#fff',
              color: activeBrand ? '#fff' : '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid #eee'
            }}>
              {activeBrand || "BRANDS"} <HiChevronDown size={14} />
            </button>

            <div className="brands-dropdown" style={styles.dropdown}>
              {brands.map(brand => (
                <div 
                  key={brand} 
                  className={`brand-item-ui ${activeBrand === brand ? 'active' : ''}`}
                  onClick={() => { setActiveBrand(brand); setActiveCategory("ALL"); }}
                  style={styles.dropdownItem}
                >
                  {brand}
                  {activeBrand === brand && <span style={{fontSize: '8px'}}>●</span>}
                </div>
              ))}
              {activeBrand && (
                <div onClick={() => setActiveBrand(null)} style={styles.resetBrand}>
                  RESET SELECTION
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.controlsBox}>
          <div style={styles.priceControl}>
            <HiOutlineAdjustments color="#aaa" />
            <span style={styles.controlLabel}>MAX PRICE: <strong>${maxPrice}</strong></span>
            <input 
              type="range" min="50" max="1500" step="10" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(e.target.value)} 
              style={styles.rangeInput} 
            />
          </div>
          <div>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={onlySale} onChange={() => setOnlySale(!onlySale)} style={{ accentColor: '#00c853' }} />
              SPECIAL OFFERS %
            </label>
          </div>
        </div>
      </section>

      <div style={styles.mainGrid}>
        <div style={{ flex: 1 }}>
          <div style={styles.gridHeader}>
            <h2 style={styles.resultsTitle}>
              {activeBrand || activeCategory} 
              <span style={styles.countBadge}>{filteredProducts.length}</span>
            </h2>
          </div>

          {isLoading ? (
            <div style={styles.productsGrid}>
              {[1, 2, 3, 4, 5, 6].map(n => <SkeletonCard key={n} />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#555', margin: '0 0 10px 0' }}>No products match your custom filters</p>
              <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 20px 0' }}>Try adjusting the price scale or clearing search metrics.</p>
              <button onClick={handleResetAllFilters} style={{ background: '#1a1a1a', color: '#fff', padding: '12px 24px', borderRadius: '14px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div style={styles.productsGrid}>
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  onAddToCart={addToCart} 
                  onShowDetails={setSelectedProduct} 
                />
              ))}
            </div>
          )}
        </div>

        <aside style={styles.sidebar}>
          <Cart />
        </aside>
      </div>

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={addToCart} 
        />
      )}
    </div>
  );
}

export default MainShop;