import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './KDSCategory.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function KDSCategory() {
  const { storeGuid, label, category } = useParams();
  const navigate = useNavigate();
  const [pendingItems, setPendingItems] = useState([]);
  const [preparedItems, setPreparedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [preparingItems, setPreparingItems] = useState(new Map());

  // Fetch store ID from GUID and label
  useEffect(() => {
    const fetchStoreId = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/stores/${storeGuid}/labels`);
        const labelData = response.data.labels.find(l => l.label === label);
        if (labelData) {
          setStoreId(labelData.store_id);
        }
      } catch (err) {
        console.error('Error fetching store ID:', err);
        setError('Failed to load store information');
      }
    };

    if (storeGuid && label) {
      fetchStoreId();
    }
  }, [storeGuid, label]);

  // Fetch category items
  useEffect(() => {
    const fetchCategoryItems = async () => {
      if (!storeId) return;

      try {
        setLoading(true);
        const response = await axios.get(
          `${API_URL}/api/kds/${storeId}/category/${encodeURIComponent(category)}`
        );
        setPendingItems(response.data.pendingItems || []);
        setPreparedItems(response.data.preparedItems || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching category items:', err);
        setError('Failed to load category items');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryItems();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchCategoryItems, 5000);
    return () => clearInterval(interval);
  }, [storeId, category]);

  const handleBack = () => {
    navigate(`/kds/${storeGuid}/${label}`);
  };

  const getPreparingQuantity = (productName) => {
    return preparingItems.get(productName) || 1;
  };

  const incrementPreparing = (productName) => {
    const current = preparingItems.get(productName) || 1;
    const item = pendingItems.find(i => i.productName === productName);
    if (item && current < item.totalQuantity) {
      setPreparingItems(new Map(preparingItems.set(productName, current + 1)));
    }
  };

  const decrementPreparing = (productName) => {
    const current = preparingItems.get(productName) || 1;
    if (current > 1) {
      setPreparingItems(new Map(preparingItems.set(productName, current - 1)));
    }
  };

  const handleMarkPrepared = async (item) => {
    const quantity = getPreparingQuantity(item.productName);
    
    try {
      // Mark the first order item as prepared
      if (item.orderItems && item.orderItems.length > 0) {
        const orderItem = item.orderItems[0];
        await axios.post(`${API_URL}/api/kds/${storeId}/mark-prepared`, {
          orderItemId: orderItem.orderItemId,
          quantity
        });
        
        // Reset preparing quantity for this item
        preparingItems.delete(item.productName);
        setPreparingItems(new Map(preparingItems));
        
        // Refresh data immediately
        const response = await axios.get(
          `${API_URL}/api/kds/${storeId}/category/${encodeURIComponent(category)}`
        );
        setPendingItems(response.data.pendingItems || []);
        setPreparedItems(response.data.preparedItems || []);
      }
    } catch (err) {
      console.error('Error marking item as prepared:', err);
      alert('Failed to mark item as prepared');
    }
  };

  if (loading && !storeId) {
    return (
      <div className="kds-category-loading">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kds-category-error">
        <div className="error-text">{error}</div>
      </div>
    );
  }

  return (
    <div className="kds-category-container">
      <header className="kds-category-header">
        <h1>{decodeURIComponent(category)}</h1>
        <button onClick={handleBack} className="back-button">
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="back-button-text">Back to Categories</span>
        </button>
      </header>

      <main className="kds-category-main">
        <div className="tabs-container">
          <nav className="tabs-nav">
            <button
              onClick={() => setActiveTab('pending')}
              className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            >
              <span>To Prepare</span>
              {pendingItems.length > 0 && (
                <span className="tab-badge">
                  {pendingItems.reduce((sum, item) => sum + item.totalQuantity, 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('prepared')}
              className={`tab-button ${activeTab === 'prepared' ? 'active' : ''}`}
            >
              <span>Prepared</span>
              {preparedItems.length > 0 && (
                <span className="tab-badge">
                  {preparedItems.reduce((sum, item) => sum + item.totalQuantity, 0)}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="items-container">
          {activeTab === 'pending' ? (
            <div className="items-grid">
              {pendingItems.length === 0 ? (
                <div className="empty-state">
                  All items prepared! 🎉
                </div>
              ) : (
                pendingItems.map((item) => {
                  const preparingQty = getPreparingQuantity(item.productName);
                  return (
                    <div key={item.productName} className="item-card pending">
                      <div className="item-info">
                        <p className="item-name">
                          {item.totalQuantity}x {item.productName}
                        </p>
                      </div>
                      <div className="item-controls">
                        <div className="quantity-controls">
                          <button
                            onClick={() => decrementPreparing(item.productName)}
                            className="quantity-button"
                          >
                            <span className="material-symbols-outlined">remove</span>
                          </button>
                          <span className="quantity-display">{preparingQty}</span>
                          <button
                            onClick={() => incrementPreparing(item.productName)}
                            className="quantity-button"
                          >
                            <span className="material-symbols-outlined">add</span>
                          </button>
                        </div>
                        <button
                          onClick={() => handleMarkPrepared(item)}
                          className="mark-done-button"
                        >
                          <span>MARK {preparingQty} DONE</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="items-grid">
              {preparedItems.length === 0 ? (
                <div className="empty-state">
                  No prepared items yet
                </div>
              ) : (
                preparedItems.map((item) => (
                  <div key={item.productName} className="item-card prepared">
                    <div className="item-info">
                      <p className="item-name">
                        {item.totalQuantity}x {item.productName}
                      </p>
                    </div>
                    <div className="item-controls">
                      <div className="prepared-check">
                        <span className="material-symbols-outlined">check</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
