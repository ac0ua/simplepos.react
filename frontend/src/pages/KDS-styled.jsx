import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './KDS.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function KDS() {
  const { storeGuid, label } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storeId, setStoreId] = useState(null);

  useEffect(() => {
    console.log('KDS mounted with params:', { storeGuid, label });
  }, []);

  useEffect(() => {
    const fetchStoreId = async () => {
      try {
        console.log('Fetching store ID for:', storeGuid, label);
        const response = await axios.get(`${API_URL}/api/stores/${storeGuid}/labels`);
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

  useEffect(() => {
    const fetchSummary = async () => {
      if (!storeId) {
        console.log('No store ID yet, skipping fetch');
        return;
      }

      try {
        console.log('Fetching KDS summary for store ID:', storeId);
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/kds/${storeId}/summary`);
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
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, [storeId]);

  const handleCategoryClick = (category) => {
    navigate(`/kds/${storeGuid}/${label}/category/${encodeURIComponent(category)}`);
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
