import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Create from './pages/Create';
import Edit from './pages/Edit';
import View from './pages/View';
import PublicFeed from './pages/PublicFeed';

export default function App() {
  return (
    <Routes>
      {/* Public blog view */}
      <Route path="/blog" element={<PublicFeed />} />
      <Route path="/blog/:slug" element={<View />} />

      {/* Admin / personal routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/edit/:id" element={<Edit />} />
        <Route path="/preview/:id" element={<View />} />
      </Route>
    </Routes>
  );
}
