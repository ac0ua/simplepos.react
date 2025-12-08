import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './KDSCategory.css';
import { API_URL, IS_PHP_BACKEND } from '../config/api';

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
        const url = IS_PHP_BACKEND
          ? `${API_URL}/stores/labels.php?storeGuid=${encodeURIComponent(storeGuid)}`
          : `${API_URL}/stores/${storeGuid}/labels`;
        const response = await axios.get(url);
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
        const url = IS_PHP_BACKEND
          ? `${API_URL}/kds/category.php?storeId=${encodeURIComponent(storeId)}&category=${encodeURIComponent(category)}`
          : `${API_URL}/kds/${storeId}/category/${encodeURIComponent(category)}`;
        const response = await axios.get(url);
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
        const url = IS_PHP_BACKEND
          ? `${API_URL}/kds/mark-prepared.php`
          : `${API_URL}/kds/${storeId}/mark-prepared`;
        const payload = IS_PHP_BACKEND
          ? { storeId, orderItemId: orderItem.orderItemId, quantity }
          : { orderItemId: orderItem.orderItemId, quantity };

        await axios.post(url, payload);
        
        // Reset preparing quantity for this item
        preparingItems.delete(item.productName);
        setPreparingItems(new Map(preparingItems));
        
        // Refresh data immediately
        const refreshUrl = IS_PHP_BACKEND
          ? `${API_URL}/kds/category.php?storeId=${encodeURIComponent(storeId)}&category=${encodeURIComponent(category)}`
          : `${API_URL}/kds/${storeId}/category/${encodeURIComponent(category)}`;
        const response = await axios.get(refreshUrl);
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
        <button onClick={handleBack} className="back-button" aria-label="Back to categories">
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          <span className="back-button-text">Back to Categories</span>
        </button>
      </header>

      <main className="kds-category-main">
        <div className="tabs-container">
          <nav className="tabs-nav" aria-label="Order status tabs">
            <button
              onClick={() => setActiveTab('pending')}
              className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
              aria-current={activeTab === 'pending' ? 'page' : undefined}
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
              aria-current={activeTab === 'prepared' ? 'page' : undefined}
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
                            aria-label="Decrease quantity to prepare"
                          >
                            <span className="material-symbols-outlined" aria-hidden="true">remove</span>
                          </button>
                          <span className="quantity-display" aria-label="Quantity to prepare">{preparingQty}</span>
                          <button
                            onClick={() => incrementPreparing(item.productName)}
                            className="quantity-button"
                            aria-label="Increase quantity to prepare"
                          >
                            <span className="material-symbols-outlined" aria-hidden="true">add</span>
                          </button>
                        </div>
                        <button
                          onClick={() => handleMarkPrepared(item)}
                          className="mark-done-button"
                          aria-label={`Mark ${preparingQty} ${item.productName} as done`}
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
