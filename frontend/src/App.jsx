import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routing/ProtectRoute';
import Auth from './pages/Auth';
import Book from './pages/Book';
import Profile from './pages/Profile';
import BookCatalog from './pages/BookCatalog';
import Recommendations from './pages/Recommendations';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><BookCatalog /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/book/:id" element={<ProtectedRoute><Book /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
