import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import './index.css';

// Error boundary — catches crashes and shows readable error instead of blank page
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('💥 App crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#dc2626' }}>⚠️ App Error</h2>
          <p style={{ color: '#374151' }}>Something crashed. Check the browser console (F12) for details.</p>
          <pre style={{
            background: '#f3f4f6', padding: '16px', borderRadius: '8px',
            fontSize: '12px', overflowX: 'auto', color: '#dc2626'
          }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px', padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '10px', fontSize: '14px' },
              success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
