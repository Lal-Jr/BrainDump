import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
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
    <Routes>
      {/* Public blog routes — default */}
      <Route path="/" element={<PublicFeed />} />
      <Route path="/:slug" element={<View />} />

      {/* Admin login */}
      <Route path="/admin/login" element={<Login />} />

      {/* Admin / personal routes (protected) */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/admin" element={<Home />} />
        <Route path="/admin/create" element={<Create />} />
        <Route path="/admin/edit/:id" element={<Edit />} />
        <Route path="/admin/preview/:id" element={<View />} />
      </Route>
    </Routes>
  );
}
