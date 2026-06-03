import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [orderFilter, setOrderFilter] = useState('Все');
  const [editingId, setEditingId] = useState(null);

  const [newProduct, setNewProduct] = useState({ 
    title: '', price: '', oldPrice: '', images: '', description: '', category: 'sneakers' 
  });
  const [issubmitting, setIsSubmitting] = useState(false);

  // Динамический URL бэкенда из переменных окружения
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sneakerhub-vsiq.onrender.com';

  // --- ФУНКЦИЯ ЗАГРУЗКИ ФАЙЛОВ ---
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/api/admin/upload`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        }
      });
      
      const uploadedUrls = res.data.urls.join(', ');
      setNewProduct(prev => ({
        ...prev,
        images: prev.images ? `${prev.images}, ${uploadedUrls}` : uploadedUrls
      }));
      alert("✅ Images uploaded to the cloud successfully!");
    } catch (err) {
      console.error(err);
      setError("Error uploading images to the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Расчет метрик (совместим как с русскими, так и с английскими статусами на бэкенде)
  const stats = useMemo(() => {
    const finishedOrders = orders.filter(o => o.status === 'Завершен' || o.status === 'Completed' || o.status === 'Delivered');
    const revenue = finishedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    return { revenue: revenue.toFixed(2), ordersCount: orders.length, productsCount: products.length };
  }, [orders, products]);

  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.shippingInfo?.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = orderFilter === 'Все' || o.status === orderFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      .admin-card { transition: all 0.3s ease; border: 1px solid #222; }
      .admin-card:hover { transform: translateY(-4px); border-color: #00c853 !important; box-shadow: 0 10px 20px rgba(0,200,83,0.1); }
      input, select, textarea { transition: 0.2s; outline: none !important; }
      input:focus, select:focus, textarea:focus { border-color: #00c853 !important; background: #1a1a1a !important; }
      .status-select { background: #222; color: #fff; border: 1px solid #333; padding: 8px; border-radius: 6px; font-size: 13px; cursor: pointer; }
      .upload-label { display: block; padding: 15px; background: #00c85315; border: 1px dashed #00c853; color: #00c853; border-radius: 8px; text-align: center; cursor: pointer; font-weight: bold; margin-bottom: 10px; transition: 0.3s; }
      .upload-label:hover { background: #00c85325; }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const headers = { 'Authorization': `Bearer ${token}` };
      const [ord, prod] = await Promise.all([
        axios.get(`${API_BASE}/api/orders`, { headers }),
        axios.get(`${API_BASE}/api/products`)
      ]);
      setOrders(ord.data); 
      setProducts(prod.data); 
      setLoading(false);
    } catch (err) { 
      setError("Failed to load dashboard statistics"); 
      setLoading(false); 
    }
  }, [navigate, API_BASE]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateOrderStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE}/api/orders/${id}/status`, { status: newStatus }, { headers: { 'Authorization': `Bearer ${token}` } });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
    } catch (err) { 
      setError("Error updating order operational status"); 
    }
  };

  const handleAddOrUpdateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const imgArray = newProduct.images.split(',').map(url => url.trim()).filter(u => u !== "");
    const data = { ...newProduct, price: Number(newProduct.price), oldPrice: Number(newProduct.oldPrice) || 0, images: imgArray };

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      if (editingId) { 
        await axios.put(`${API_BASE}/api/admin/products/${editingId}`, data, { headers }); 
      } else { 
        await axios.post(`${API_BASE}/api/admin/products`, data, { headers }); 
      }
      setNewProduct({ title: '', price: '', oldPrice: '', images: '', description: '', category: 'sneakers' });
      setEditingId(null); 
      fetchData();
    } catch (err) { 
      setError("Error saving product changes onto database"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewProduct({ title: '', price: '', oldPrice: '', images: '', description: '', category: 'sneakers' });
  };

  const styles = {
    container: { padding: '30px 5%', color: '#e0e0e0', background: '#0a0a0a', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
    card: { background: '#111', padding: '20px', borderRadius: '15px', border: '1px solid #222', marginBottom: '20px' },
    input: { padding: '12px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }
  };

  if (loading) return <div style={styles.container}>LOADING DASHBOARD SYSTEM...</div>;

  return (
    <div style={styles.container}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: '-1px' }}>DASHBOARD</h1>
        <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} style={{ background: '#ff1744', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>LOG OUT</button>
      </header>

      {error && <div style={{ color: '#ff1744', marginBottom: '20px', fontWeight: 'bold' }}>⚠️ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
        <div style={styles.card}><small style={{ color: '#888', fontWeight: 'bold' }}>TOTAL REVENUE</small><div style={{ fontSize: '24px', color: '#00c853', fontWeight: 900 }}>${stats.revenue}</div></div>
        <div style={styles.card}><small style={{ color: '#888', fontWeight: 'bold' }}>ORDERS PLACED</small><div style={{ fontSize: '24px', fontWeight: 900 }}>{stats.ordersCount}</div></div>
        <div style={styles.card}><small style={{ color: '#888', fontWeight: 'bold' }}>TOTAL PRODUCTS</small><div style={{ fontSize: '24px', fontWeight: 900 }}>{stats.productsCount}</div></div>
      </div>

      <div style={{ ...styles.card, display: 'flex', gap: '15px' }}>
        <input style={styles.input} placeholder="Search records by keywords..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <form onSubmit={handleAddOrUpdateProduct} style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>{editingId ? '📝 Edit Product Information' : '➕ Add New Store Item'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px' }}>
          <input style={styles.input} placeholder="Product Title" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} required />
          <input style={styles.input} type="number" placeholder="Price ($)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
          <input style={styles.input} type="number" placeholder="Old Price (Discount)" value={newProduct.oldPrice} onChange={e => setNewProduct({...newProduct, oldPrice: e.target.value})} />
          <select 
            style={styles.input} 
            value={newProduct.category} 
            onChange={e => setNewProduct({...newProduct, category: e.target.value})}
          >
            <option value="sneakers">Sneakers</option>
            <option value="running">Running</option>
            <option value="lifestyle">Lifestyle</option>
          </select>
        </div>
        
        {/* КНОПКА ЗАГРУЗКИ КАРТИНОК */}
        <div>
          <label className="upload-label">
            📸 UPLOAD IMAGES FROM DEVICE
            <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*" />
          </label>
          <input style={styles.input} placeholder="Or paste image asset URLs separated by commas..." value={newProduct.images} onChange={e => setNewProduct({...newProduct, images: e.target.value})} required />
        </div>

        <textarea style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} placeholder="Product Markdown Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} required />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={issubmitting} style={{ flex: 2, background: editingId ? '#2979ff' : '#00c853', color: '#fff', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
            {issubmitting ? 'PROCESSING...' : 'CONFIRM SAVING'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} style={{ flex: 1, background: '#333', color: '#fff', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
              CANCEL EDIT
            </button>
          )}
        </div>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>🛒 Incoming Orders</h2>
        <select className="status-select" value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}>
          <option value="Все">All Statuses</option>
          <option value="Новый">New</option>
          <option value="В пути">In Transit</option>
          <option value="Завершен">Completed</option>
        </select>
      </div>

      <div style={{ ...styles.card, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead style={{ background: '#1a1a1a', fontSize: '12px', color: '#888' }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left' }}>CUSTOMER</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>FULFILLMENT STATUS</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>TOTAL PAID</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order._id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '15px', fontWeight: '500' }}>{order.shippingInfo?.customerName || 'Guest'}</td>
                <td style={{ padding: '15px' }}>
                  <select className="status-select" value={order.status} onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}>
                    <option value="Новый">New</option>
                    <option value="В пути">In Transit</option>
                    <option value="Завершен">Completed</option>
                  </select>
                </td>
                <td style={{ padding: '15px', textAlign: 'right', color: '#00c853', fontWeight: 900 }}>${order.totalPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: '50px', marginBottom: '20px' }}>📦 Available Catalog Items ({filteredProducts.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {filteredProducts.map(p => (
          <div key={p._id} style={styles.card} className="admin-card">
            <img src={p.images?.[0] || 'https://via.placeholder.com/150'} alt="" style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '10px' }} />
            <div style={{ fontWeight: 'bold', margin: '12px 0 6px 0', fontSize: '16px' }}>{p.title}</div>
            <div style={{ color: '#00c853', fontWeight: 900, fontSize: '18px', marginBottom: '12px' }}>${p.price}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => { 
                  setEditingId(p._id); 
                  setNewProduct({...p, images: p.images.join(', ')}); 
                  window.scrollTo({ top: 0, behavior: 'smooth' }); 
                }} 
                style={{ flex: 1, background: '#2979ff20', color: '#2979ff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}
              >
                EDIT
              </button>
              <button 
                onClick={async () => { 
                  if(window.confirm("Are you sure you want to permanently delete this item from database?")) { 
                    await axios.delete(`${API_BASE}/api/admin/products/${p._id}`, { 
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
                    }); 
                    fetchData(); 
                  } 
                }} 
                style={{ flex: 1, background: '#ff174420', color: '#ff1744', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}
              >
                DELETE
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;