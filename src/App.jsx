import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import your API functions
import { authApi, dbApi } from './lib/appwrite/api';

// Import sonner for toasts
import { Toaster, toast } from 'sonner';

// Import your page components
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';

// Icons for UI components
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

// --- (Suggested location: src/context/AuthContext.jsx) ---
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messageBox, setMessageBox] = useState({ isOpen: false, title: '', content: '', onConfirm: null, isConfirm: false });

    // --- Notification System ---
    const showMessage = (type, text) => {
        if (type === 'success') toast.success(text);
        else toast.error(text);
    };

    const showConfirmBox = (title, content, onConfirm) => {
        setMessageBox({ isOpen: true, title, content, onConfirm, isConfirm: true });
    };
    
    const closeMessageBox = () => setMessageBox({ ...messageBox, isOpen: false });

    // --- Auth Lifecycle ---
    useEffect(() => {
        const checkUser = async () => {
            try {
                const currentUser = await authApi.getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    // --- Auth Actions ---
    const login = async (email, password) => {
        try {
            await authApi.login(email, password);
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
            showMessage('success', 'Logged in successfully!');
            return currentUser;
        } catch (error) {
            showMessage('error', `Login failed: ${error.message}`);
            return null;
        }
    };

    const register = async (email, password, name) => {
        try {
            const newUser = await authApi.register(email, password, name);
            await dbApi.createStudentProfile({ user_id: newUser.$id, name, department: 'N/A' });
            showMessage('success', 'Registration successful! Please log in.');
            return true;
        } catch (error) {
            if (error.code === 409) {
                showMessage('error', 'Registration failed: User with this email already exists.');
            } else {
                showMessage('error', `Registration failed: ${error.message}`);
            }
            return false;
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await authApi.logout();
            showMessage('success', 'Logged out successfully!');
        } catch (error) {
            // Log the error for debugging but proceed with client-side logout
            console.error("Server-side logout failed, proceeding with client-side logout:", error);
            showMessage('error', 'Could not contact server, logging out locally.');
        } finally {
            // This block ensures the user is logged out on the client and redirected,
            // even if the server call fails.
            setUser(null);
            setLoading(false);
            window.location.assign('/login');
        }
    };

    const value = { user, loading, login, register, logout, showMessage, showConfirmBox };

    return (
        <AuthContext.Provider value={value}>
            <Toaster position="top-right" richColors />
            {children}
            {messageBox.isOpen && (
                <MessageBox
                    title={messageBox.title}
                    content={messageBox.content}
                    onConfirm={messageBox.onConfirm}
                    onClose={closeMessageBox}
                    isConfirm={messageBox.isConfirm}
                />
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// --- (Suggested location: src/components/common/LoadingSpinner.jsx) ---
const LoadingSpinner = () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-100 z-50">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-indigo-500"></div>
        <p className="mt-6 text-gray-700 text-lg font-semibold">Loading Dashboard...</p>
    </div>
);

// --- (Suggested location: src/components/common/MessageBox.jsx) ---
const MessageBox = ({ title, content, onConfirm, isConfirm, onClose }) => {
    const Icon = isConfirm ? AlertTriangle : Info;
    const iconColor = isConfirm ? 'text-red-500' : 'text-blue-500';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in-down">
                <div className="p-6 text-center">
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isConfirm ? 'bg-red-100' : 'bg-blue-100'}`}>
                        <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mt-5">{title}</h3>
                    <p className="text-sm text-gray-500 mt-2">{content}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-b-xl flex justify-center space-x-4">
                    {isConfirm && (
                        <button onClick={onClose} className="px-4 py-2 w-full bg-white text-gray-900 rounded-md border border-gray-300 hover:bg-gray-50 transition duration-200 text-sm font-semibold">
                            Cancel
                        </button>
                    )}
                    <button onClick={() => { onConfirm && onConfirm(); onClose(); }} className="px-4 py-2 w-full bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200 text-sm font-semibold">
                        {isConfirm ? 'Confirm' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- (Suggested location: src/components/routes/ProtectedRoute.jsx) ---
const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

    const isAdmin = user.labels && user.labels.includes('admin');
    if (role === 'admin' && !isAdmin) return <Navigate to="/student" replace />;
    if (role === 'student' && isAdmin) return <Navigate to="/admin" replace />;

    return children;
};

// --- NEW: Route for users who are NOT authenticated ---
const AuthRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <LoadingSpinner />;

    if (user) {
        const isAdmin = user.labels && user.labels.includes('admin');
        return <Navigate to={isAdmin ? '/admin' : '/student'} replace />;
    }

    return children;
};


// --- Main App Component ---
function App() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Routes>
                {/* Auth Routes: Accessible only when logged out */}
                <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
                <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />

                {/* Protected Routes: Accessible only when logged in */}
                <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />

                {/* Default redirect for root path */}
                <Route path="/" element={<InitialRedirect />} />

                {/* Fallback for undefined routes */}
                <Route path="*" element={<div className="text-center mt-20 text-xl">404 - Page Not Found</div>} />
            </Routes>
            <style>{`
              @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
              @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-10px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
              .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
              .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
}

// Helper component for initial redirection logic
const InitialRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" replace />;
    
    const isAdmin = user.labels && user.labels.includes('admin');
    return <Navigate to={isAdmin ? "/admin" : "/student"} replace />;
};

// Default export of App
export default App;
