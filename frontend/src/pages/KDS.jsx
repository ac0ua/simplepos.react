import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './KDS.css';
import { API_URL, IS_PHP_BACKEND } from '../config/api';

export default function KDS() {
  const { storeGuid, label } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeId, setStoreId] = useState(null);

  // Debug: Log URL parameters
  useEffect(() => {
    console.log('KDS mounted with params:', { storeGuid, label });
  }, []);

  // Fetch store ID from GUID and label
  useEffect(() => {
    const fetchStoreId = async () => {
      try {
        console.log('Fetching store ID for:', storeGuid, label);
        const url = IS_PHP_BACKEND
          ? `${API_URL}/stores/labels.php?storeGuid=${encodeURIComponent(storeGuid)}`
          : `${API_URL}/stores/${storeGuid}/labels`;
        const response = await axios.get(url);
        console.log('Store labels response:', response.data);
        const labelData = response.data.labels.find(l => l.label === label);
        if (labelData) {
          console.log('Found store ID:', labelData.store_id);
          setStoreId(labelData.store_id);
        } else {
          console.error('Label not found:', label);
          setError('Store label not found');
        }
      } catch (err) {
        console.error('Error fetching store ID:', err);
        setError('Failed to load store information: ' + err.message);
      }
    };

    if (storeGuid && label) {
      fetchStoreId();
    }
  }, [storeGuid, label]);

  // Fetch KDS summary
  useEffect(() => {
    const fetchSummary = async () => {
      if (!storeId) {
        console.log('No store ID yet, skipping fetch');
        return;
      }

      try {
        console.log('Fetching KDS summary for store ID:', storeId);
        setLoading(true);
        const url = IS_PHP_BACKEND
          ? `${API_URL}/kds/summary.php?storeId=${encodeURIComponent(storeId)}`
          : `${API_URL}/kds/${storeId}/summary`;
        const response = await axios.get(url);
        console.log('KDS summary response:', response.data);
        setSummary(response.data.summary || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching KDS summary:', err);
        setError('Failed to load kitchen display data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, [storeId]);

  const handleCategoryClick = (category) => {
    navigate(`/kds/${storeGuid}/${label}/category/${encodeURIComponent(category)}`);
  };

  const getCategoryColor = (category, totalPending) => {
    // If all items are prepared (no pending), show green
    if (totalPending === 0) {
      return 'bg-green-800/80';
    }
    // Otherwise show red for pending items
    return 'bg-red-800/80';
  };

  const getCategoryBadgeColor = (totalPending) => {
    if (totalPending === 0) {
      return 'bg-green-600';
    }
    return 'bg-red-600';
  };

  if (loading && !storeId) {
    return (
      <div className="kds-loading">
        <div>Loading Kitchen Display...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kds-error">
        <div className="error-icon">⚠️</div>
        <div className="error-title">Error</div>
        <div className="error-message">{error}</div>
        <div className="error-details">
          <div>Store GUID: {storeGuid || 'missing'}</div>
          <div>Label: {label || 'missing'}</div>
          <div>Store ID: {storeId || 'not loaded'}</div>
        </div>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="kds-container">
      <header className="kds-header">
        <h1>Kitchen Display System</h1>
        <div className="auto-refresh">Auto-refresh: 5s</div>
      </header>
      <main className="kds-main">
        <div className="kds-grid">
          {loading && summary.length === 0 ? (
            <div className="kds-empty">
              <div className="empty-title">Loading orders...</div>
              <div className="empty-subtitle">Connecting to kitchen system</div>
            </div>
          ) : summary.length === 0 ? (
            <div className="kds-empty">
              <div className="empty-icon">✓</div>
              <div className="empty-title">No active orders</div>
              <div className="empty-subtitle">Orders will appear here automatically</div>
            </div>
          ) : (
            summary.map((categoryData) => {
              const isPending = categoryData.totalPending > 0;
              return (
                <div
                  key={categoryData.category}
                  onClick={() => handleCategoryClick(categoryData.category)}
                  className={`category-card ${isPending ? 'pending' : 'done'}`}
                >
                  <h2 className="category-name">{categoryData.category}</h2>
                  
                  {isPending ? (
                    <>
                      <div className="category-badge pending-badge">
                        <span className="badge-number">{categoryData.totalPending}</span>
                      </div>
                      <button className="view-button">VIEW</button>
                    </>
                  ) : (
                    <>
                      <div className="category-badge done-badge">
                        <span className="material-symbols-outlined">check</span>
                      </div>
                      <div className="done-button">DONE</div>
                    </>
                  )}
                  
                  {categoryData.totalPrepared > 0 && (
                    <div className="prepared-count">
                      {categoryData.totalPrepared} prepared
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
