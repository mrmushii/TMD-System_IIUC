import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; // Assuming App.jsx exports useAuth
import { dbApi } from '../lib/appwrite/api'; // Import your Appwrite API

// shadcn/ui components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// No need to import Input here as it's used in child components
import { Button } from '@/components/ui/button'; // Assuming Button is shadcn/ui Button


// Icons
import { LogOut, ChevronDown, Calendar, User, Ticket, Search, LayoutDashboard, Star, Megaphone, ArrowRight } from 'lucide-react';
import { format, isFuture, parseISO } from 'date-fns';

// --- Child Components (replace with your actual imports) ---
import BusFinder from '../components/student/BusFinder';
import MyReservations from '../components/student/MyReservations';
import StudentProfile from '../components/student/StudentProfile';
import AnnouncementBar from '../components/student/AnnouncementBar'; // Assuming you have this component

// --- Reusable UI Components ---
const LoadingSpinner = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-indigo-500"></div>
        <p className="mt-6 text-gray-700 text-lg font-semibold">Loading Student Dashboard...</p>
    </div>
);

const StudentHeader = ({ user, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const avatarInitial = user?.name?.[0]?.toUpperCase() || 'S';
    const avatarUrl = user?.avatar || `https://placehold.co/40x40/34D399/FFFFFF?text=${avatarInitial}`;

    return (
        <header className="bg-white text-gray-800 p-4 shadow-sm border-b border-gray-200 flex justify-between items-center z-10">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Student Dashboard</h1>
            <div className="flex items-center space-x-6">
                <div className="hidden md:flex items-center space-x-2 text-gray-500">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium text-sm">{formatDate(currentTime)}</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md">{currentTime.toLocaleTimeString()}</span>
                </div>
                <div className="relative">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200">
                        <img src={avatarUrl} alt="User Avatar" className="h-9 w-9 rounded-full ring-2 ring-offset-1 ring-teal-500" />
                        <span className="hidden sm:inline font-semibold text-gray-700">{user.name || user.email}</span>
                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden origin-top-right animate-fade-in-down">
                            <div className="p-4 border-b border-gray-200">
                                <p className="font-bold text-gray-800">{user.name || user.email}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <Button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors duration-200">
                                <LogOut className="h-5 w-5" />
                                <span className="font-semibold">Logout</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

// --- Dashboard Overview Components ---
const NextTripCard = ({ nextTrip, onFindBusClick, isLoading }) => (
    <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg">
        <CardHeader><CardTitle className="text-2xl">Your Next Trip</CardTitle></CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="animate-pulse space-y-3">
                    <div className="h-8 bg-indigo-500 rounded w-3/4"></div>
                    <div className="h-6 bg-indigo-500 rounded w-1/2"></div>
                    <div className="h-4 bg-indigo-500 rounded w-1/3"></div>
                </div>
            ) : nextTrip ? (
                <div className="space-y-2">
                    <p className="text-4xl font-bold">{format(parseISO(nextTrip.reservation_date), 'MMM dd')}</p>
                    <p className="text-lg">{nextTrip.routeName} ({nextTrip.time})</p>
                    <p className="text-sm opacity-80">Bus: {nextTrip.busNumber}</p>
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-lg mb-4">No upcoming trips scheduled.</p>
                    <Button onClick={onFindBusClick} className="bg-white text-indigo-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors">Find a Bus</Button>
                </div>
            )}
        </CardContent>
    </Card>
);

const StatCard = ({ title, value, icon: Icon, isLoading }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
            <Icon className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            ) : (
                <div className="text-2xl font-bold">{value}</div>
            )}
        </CardContent>
    </Card>
);

const AnnouncementsCard = ({ announcements, isLoading }) => (
    <Card>
        <CardHeader><CardTitle className="flex items-center"><Megaphone className="mr-2 h-5 w-5 text-indigo-500" />Announcements</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            {isLoading ? (
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
            ) : announcements && announcements.length > 0 ? (
                announcements.map((item) => (
                    <div key={item.$id} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-2"><Megaphone className="h-5 w-5 text-indigo-600" /></div>
                        <div>
                            <p className="font-semibold text-gray-800">{item.title}</p>
                            <p className="text-sm text-gray-600">{item.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{format(parseISO(item.timestamp), 'PPP')}</p> {/* Use item.timestamp */}
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-gray-500 py-4">No announcements at this time.</p>
            )}
        </CardContent>
    </Card>
);

const DashboardOverview = ({ reservations, announcements, onFindBusClick, isLoading }) => {
    const upcomingTrips = useMemo(() => 
        reservations.filter(r => r.status === 'Booked' && isFuture(parseISO(r.reservation_date))).sort((a, b) => new Date(a.reservation_date) - new Date(b.reservation_date)), 
        [reservations]
    );

    const favoriteRoute = useMemo(() => {
        if (reservations.length === 0) return 'N/A';
        const routeCounts = reservations.reduce((acc, res) => {
            acc[res.routeName] = (acc[res.routeName] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(routeCounts).reduce((a, b) => routeCounts[a] > routeCounts[b] ? a : b, 'N/A');
    }, [reservations]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><NextTripCard nextTrip={upcomingTrips[0]} onFindBusClick={onFindBusClick} isLoading={isLoading} /></div>
            <div className="space-y-6">
                <StatCard title="Total Trips Taken" value={reservations.filter(r => r.status === 'Boarded').length} icon={Ticket} isLoading={isLoading} />
                <StatCard title="Favorite Route" value={favoriteRoute} icon={Star} isLoading={isLoading} />
            </div>
            <div className="md:col-span-2 lg:col-span-3"><AnnouncementsCard announcements={announcements} isLoading={isLoading} /></div>
        </div>
    );
};


// --- Main StudentDashboard Page Component ---
const StudentDashboard = () => {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [dashboardData, setDashboardData] = useState({ reservations: [], buses: [], routes: [], schedules: [], announcements: [], stops: [] });
    const [dataLoading, setDataLoading] = useState(true); // Separate loading state for dashboard data

    useEffect(() => {
        const fetchAllData = async () => {
            if (!user) return;
            setDataLoading(true); // Set dataLoading to true when starting fetch
            try {
                const [reservationsRes, busesRes, routesRes, schedulesRes, announcementsRes, stopsRes] = await Promise.all([
                    dbApi.getReservations(user.$id),
                    dbApi.getBuses(),
                    dbApi.getRoutes(),
                    dbApi.getSchedules(),
                    dbApi.getAllAnnouncements(), // Use getAllAnnouncements
                    dbApi.getStops(),
                ]);
                
                const processedReservations = reservationsRes.map(res => {
                    const schedule = schedulesRes.find(s => s.$id === res.schedule_id);
                    const bus = busesRes.find(b => b.$id === res.bus_id);
                    const route = schedule ? routesRes.find(r => r.$id === schedule.route_id) : null;
                    return { ...res, routeName: route ? `${route.origin} → ${route.destination}` : 'N/A', busNumber: bus ? bus.bus_number : 'N/A', time: schedule ? `${schedule.departure_time} - ${schedule.arrival_time}` : 'N/A' };
                });

                setDashboardData({ reservations: processedReservations, buses: busesRes, routes: routesRes, schedules: schedulesRes, announcements: announcementsRes, stops: stopsRes });
            } catch (error) {
                console.error("Failed to load dashboard data", error);
                // Handle error state for dashboard data
            } finally {
                setDataLoading(false); // Set dataLoading to false when fetch is complete
            }
        };
        fetchAllData();
    }, [user, refreshTrigger]); // Depend on user and refreshTrigger

    // Main app loading check (for initial auth)
    if (loading) return <LoadingSpinner />;
    // Redirect if not authenticated or is admin
    if (!user || (user.labels && user.labels.includes('admin'))) return null;

    const handleReservationChange = () => {
        setRefreshTrigger(prev => prev + 1);
        setActiveTab('my-reservations');
    };
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <StudentHeader user={user} onLogout={logout} />
            {/* Announcement Bar - assuming it's a separate component */}
            <AnnouncementBar />
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
                <div className="px-6 pt-4 bg-white border-b border-gray-200">
                    <TabsList className="h-auto bg-transparent p-0 flex flex-wrap">
                        <TabsTrigger value="dashboard" className="group relative px-4 py-3 text-base font-medium text-gray-500 hover:bg-gray-100 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all">
                            <LayoutDashboard className="mr-2 h-5 w-5 transition-colors group-data-[state=active]:text-indigo-500" />
                            Dashboard
                            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300" />
                        </TabsTrigger>
                        <TabsTrigger value="find-bus" className="group relative px-4 py-3 text-base font-medium text-gray-500 hover:bg-gray-100 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all">
                            <Search className="mr-2 h-5 w-5 transition-colors group-data-[state=active]:text-indigo-500" />
                            Find Bus
                            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300" />
                        </TabsTrigger>
                        <TabsTrigger value="my-reservations" className="group relative px-4 py-3 text-base font-medium text-gray-500 hover:bg-gray-100 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all">
                            <Ticket className="mr-2 h-5 w-5 transition-colors group-data-[state=active]:text-indigo-500" />
                            My Reservations
                            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300" />
                        </TabsTrigger>
                        <TabsTrigger value="my-profile" className="group relative px-4 py-3 text-base font-medium text-gray-500 hover:bg-gray-100 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all">
                            <User className="mr-2 h-5 w-5 transition-colors group-data-[state=active]:text-indigo-500" />
                            My Profile
                            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300" />
                        </TabsTrigger>
                    </TabsList>
                </div>

                <main className="flex-grow p-4 sm:p-6 lg:p-8 bg-gray-50">
                    <TabsContent value="dashboard" className="mt-0">
                        {/* Pass dataLoading to DashboardOverview */}
                        <DashboardOverview 
                            reservations={dashboardData.reservations} 
                            announcements={dashboardData.announcements} 
                            onFindBusClick={() => setActiveTab('find-bus')} 
                            isLoading={dataLoading} 
                        />
                    </TabsContent>
                    <TabsContent value="find-bus" className="mt-0">
                        {/* Pass all necessary data and loading state to BusFinder */}
                        <BusFinder 
                            onReservationMade={handleReservationChange} 
                            routes={dashboardData.routes}
                            schedules={dashboardData.schedules}
                            buses={dashboardData.buses}
                            stops={dashboardData.stops}
                            isLoading={dataLoading} // Pass loading state
                        />
                    </TabsContent>
                    <TabsContent value="my-reservations" className="mt-0">
                        {/* Pass reservations and loading state to MyReservations */}
                        <MyReservations 
                            reservations={dashboardData.reservations} 
                            refreshTrigger={refreshTrigger} 
                            isLoading={dataLoading} // Pass loading state
                        />
                    </TabsContent>
                    <TabsContent value="my-profile" className="mt-0">
                        {/* Pass loading state to StudentProfile */}
                        <StudentProfile isLoading={dataLoading} />
                    </TabsContent>
                </main>
            </Tabs>
        </div>
    );
};

export default StudentDashboard;
