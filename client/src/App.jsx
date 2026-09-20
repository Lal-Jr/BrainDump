import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import LoadingSpinner from './components/ui/LoadingSpinner';
import PublicLayout from './components/public/PublicLayout';
import Feed from './pages/Feed';
import { loadPost } from './lib/routes';

// Split points: the feed is the lightest possible first load (no markdown/highlighting code),
// the post page loads on demand (and is warmed on link hover), admin never loads for readers.
const Post = lazy(loadPost);
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Create = lazy(() => import('./pages/admin/Create'));
const Edit = lazy(() => import('./pages/admin/Edit'));
const Login = lazy(() => import('./pages/admin/Login'));

// key on the slug so a different post always mounts fresh (never shows the previous post's data)
function PostRoute() {
  const { slug } = useParams();
  return <Post key={slug} slug={slug} />;
}

function RequireAuth({ children }) {
  const { authenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Checking session" />;
  return authenticated ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner text="Loading" />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<ErrorBoundary><Feed /></ErrorBoundary>} />
              <Route path="/:slug" element={<ErrorBoundary><PostRoute /></ErrorBoundary>} />
            </Route>

            <Route path="/admin/login" element={<Login />} />
            <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
              <Route path="/admin" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/admin/create" element={<ErrorBoundary><Create /></ErrorBoundary>} />
              <Route path="/admin/edit/:id" element={<ErrorBoundary><Edit /></ErrorBoundary>} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </ToastProvider>
  );
}
