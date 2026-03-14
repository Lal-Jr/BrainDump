import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Home from './pages/Home';
import Create from './pages/Create';
import Edit from './pages/Edit';
import View from './pages/View';
import PublicFeed from './pages/PublicFeed';
import Login from './pages/Login';
import LoadingSpinner from './components/LoadingSpinner';

function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Checking auth..." />;
  if (!authenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
    <ErrorBoundary>
      <Routes>
        {/* Public blog routes — default */}
        <Route path="/" element={<ErrorBoundary><PublicFeed /></ErrorBoundary>} />
        <Route path="/:slug" element={<ErrorBoundary><View /></ErrorBoundary>} />

        {/* Admin login */}
        <Route path="/admin/login" element={<Login />} />

        {/* Admin / personal routes (protected) */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/admin" element={<ErrorBoundary><Home /></ErrorBoundary>} />
          <Route path="/admin/create" element={<ErrorBoundary><Create /></ErrorBoundary>} />
          <Route path="/admin/edit/:id" element={<ErrorBoundary><Edit /></ErrorBoundary>} />
          <Route path="/admin/preview/:id" element={<ErrorBoundary><View /></ErrorBoundary>} />
        </Route>
      </Routes>
    </ErrorBoundary>
    </ToastProvider>
  );
}
