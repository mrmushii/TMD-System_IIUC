import React, { useState, useEffect } from 'react';
import { useAuth } from '../App'; // Using the REAL hook from your AuthContext
import AdminDashboardTabs from '../components/AdminDashboardTabs';

// Icons
import { LogOut, ChevronDown, Calendar } from 'lucide-react';

// --- Reusable Header Component ---
// This can be kept here or moved to its own file, e.g., src/components/admin/AdminHeader.jsx
const AdminHeader = ({ user, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Fallback for avatar if user name is not available
    const avatarInitial = user?.name?.[0]?.toUpperCase() || 'A';
    const avatarUrl = user?.avatar || `https://placehold.co/40x40/6366F1/FFFFFF?text=${avatarInitial}`;

    return (
        <header className="bg-white text-gray-800 p-4 shadow-sm border-b border-gray-200 flex justify-between items-center z-10">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-6">
                <div className="hidden md:flex items-center space-x-2 text-gray-500">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium text-sm">{formatDate(currentTime)}</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">{currentTime.toLocaleTimeString()}</span>
                </div>
                <div className="relative">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200">
                        <img src={avatarUrl} alt="User Avatar" className="h-9 w-9 rounded-full ring-2 ring-offset-1 ring-indigo-500" />
                        <span className="hidden sm:inline font-semibold text-gray-700">{user.name}</span>
                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden origin-top-right animate-fade-in-down">
                            <div className="p-4 border-b border-gray-200">
                                <p className="font-bold text-gray-800">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors duration-200">
                                <LogOut className="h-5 w-5" />
                                <span className="font-semibold">Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};


// --- Main AdminDashboard Page Component ---
const AdminDashboard = () => {
    // This component now correctly uses the REAL useAuth hook.
    // The `logout` function will be the one from your AuthContext that handles redirection.
    const { user, logout } = useAuth();

    // The ProtectedRoute in App.jsx now handles loading states and redirection.
    // If this component renders, we can be sure the user is a logged-in admin.
    // This makes the component much cleaner and focused on its primary task.
    
    if (!user) {
        // This is a fallback case. ProtectedRoute should prevent this from ever being seen.
        return null; 
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <AdminHeader user={user} onLogout={logout} />
            <AdminDashboardTabs />
        </div>
    );
};

export default AdminDashboard;
