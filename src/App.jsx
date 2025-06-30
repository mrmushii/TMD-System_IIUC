// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register'; // Import the new Register component
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { account } from './lib/appwrite/config'; // Path relative to src/

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);


  const isAdmin = currentUser?.labels?.includes('admin');

  // Check user session on app load
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const user = await account.get();
        setCurrentUser(user);
      } catch (error) {
        console.log("No active session on app load, user not logged in. Error:", error);
        setCurrentUser(null); // Ensure user is null if no session
      } finally {
        setLoadingApp(false); // Done checking initial session
      }
    };

    checkUserSession();
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await account.deleteSessions();
      setCurrentUser(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show a loading indicator while checking auth status
  if (loadingApp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">Loading application...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={!currentUser ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to={isAdmin ? "/admin" : "/student"} replace />}
        />
        <Route
          path="/register"
          element={!currentUser ? <Register /> : <Navigate to={isAdmin ? "/admin" : "/student"} replace />}
        />

        {/* Protected Admin Route */}
        <Route
          path="/admin"
          element={currentUser && isAdmin ? <AdminDashboard currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />

        {/* Protected Student Route */}
        <Route
          path="/student"
          element={currentUser && !isAdmin ? <StudentDashboard currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />

        {/* Redirect root path based on login status and role */}
        <Route
          path="/"
          element={currentUser ? <Navigate to={isAdmin ? "/admin" : "/student"} replace /> : <Navigate to="/login" replace />}
        />

        {/* Fallback for undefined routes */}
        <Route path="*" element={<p className="text-center mt-20 text-xl">404 - Page Not Found</p>} />
      </Routes>
    </Router>
  );
}

export default App;