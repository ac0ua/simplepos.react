import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

// Detect base path dynamically for different deployment locations
const getBasename = () => {
  const pathname = window.location.pathname;
  if (pathname.startsWith('/simplepos.react')) return '/simplepos.react';
  if (pathname.startsWith('/tools/simplepos')) return '/tools/simplepos';
  // Default - try to detect from first path segment(s)
  const match = pathname.match(/^(\/[^/]+(?:\/[^/]+)?)/);
  if (match && match[1] !== '/php-backend') return match[1];
  return '';
};

const basename = getBasename();
console.log('[SimplePOS] Router basename:', basename);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        basename={basename}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff'
            },
            success: {
              style: {
                background: '#4caf50'
              }
            },
            error: {
              style: {
                background: '#f44336'
              }
            }
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
