import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import AppRouter from './AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--surface-color)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  );
}

export default App;