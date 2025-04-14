import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WisdomMinimalLanding from './pages/WisdomMinimalLanding';
import ArticlePage from './pages/ArticlePage';
import ExamplePage from './pages/ExamplePage';
import { isAuthenticated } from './services/supabaseClient';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    // Redirect to the landing page if not authenticated
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
        <Routes>
          <Route path="/" element={<WisdomMinimalLanding />} />
          <Route 
            path="/article" 
            element={
              <ProtectedRoute>
                <ArticlePage />
              </ProtectedRoute>
            } 
          />
          <Route path="/example" element={<ExamplePage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
