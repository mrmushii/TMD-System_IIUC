// src/components/student/MyReservations.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../App'; // Adjust path as necessary
import { dbApi } from '../../lib/appwrite/api'; // Adjust path as necessary

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Icons
import { Ticket, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

// --- Reusable Sub-components ---

const StatusBadge = ({ status }) => {
    const styles = {
        Booked: 'bg-blue-100 text-blue-800 ring-blue-600/20',
        Cancelled: 'bg-red-100 text-red-800 ring-red-600/20',
        Boarded: 'bg-green-100 text-green-800 ring-green-600/20',
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const ReservationCard = ({ reservation, onCancel }) => (
    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
        <div>
            <p className="font-bold text-gray-800">{reservation.routeName}</p>
            <p className="text-sm text-gray-500">{format(new Date(reservation.reservation_date), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-semibold">Bus:</span> {reservation.busNumber}</p>
            <p><span className="font-semibold">Time:</span> {reservation.time}</p>
        </div>
        <div className="flex justify-between items-center pt-2">
            <StatusBadge status={reservation.status} />
            {reservation.status === 'Booked' && (
                <Button variant="destructive" size="sm" onClick={() => onCancel(reservation.$id)} className="bg-red-100 text-red-700 hover:bg-red-200 text-xs h-8">
                    Cancel
                </Button>
            )}
        </div>
    </div>
);

const SkeletonCard = () => (
    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-2 pt-2">
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
    </div>
);

const ErrorDisplay = ({ onRetry }) => (
    <div className="text-center py-8 px-4 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <h3 className="mt-2 text-md font-semibold text-red-800">Failed to Load Reservations</h3>
        <p className="mt-1 text-sm text-red-700">There was a problem fetching your data. Please try again.</p>
        <Button onClick={onRetry} className="mt-4 bg-red-600 hover:bg-red-700 text-white text-sm h-9">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
    </div>
);


// --- Main MyReservations Component ---
const MyReservations = ({ refreshTrigger }) => {
    const { user, showMessage, showConfirmBox } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [relatedData, setRelatedData] = useState({ buses: {}, routes: {}, schedules: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        setError(false);
        // Explicitly reset relatedData to empty maps before fetching to ensure no stale data
        setRelatedData({ buses: {}, routes: {}, schedules: {} });
        try {
            // Fetch only the reservations for the current student
            const studentReservations = await dbApi.getReservations(user.$id);
            setReservations(studentReservations);

            // Fetch related data only if there are reservations to avoid unnecessary calls
            if (studentReservations.length > 0) {
                const [routesRes, schedulesRes, busesRes] = await Promise.all([
                    dbApi.getRoutes(),
                    dbApi.getSchedules(),
                    dbApi.getBuses(),
                ]);

                // Create maps for easy lookup
                const routesMap = routesRes.reduce((acc, r) => ({ ...acc, [r.$id]: r }), {});
                const schedulesMap = schedulesRes.reduce((acc, s) => ({ ...acc, [s.$id]: s }), {});
                const busesMap = busesRes.reduce((acc, b) => ({ ...acc, [b.$id]: b }), {});

                setRelatedData({ routes: routesMap, schedules: schedulesMap, buses: busesMap });
            }
        } catch (err) {
            console.error("Error fetching reservation data:", err);
            showMessage('error', `Failed to load reservations: ${err.message}`);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, refreshTrigger]); // Re-fetch when user or refreshTrigger changes

    const handleCancelReservation = (reservationId) => {
        showConfirmBox('Cancel Reservation', 'Are you sure you want to cancel this reservation?', async () => {
            try {
                await dbApi.updateReservation(reservationId, { status: 'Cancelled' });
                showMessage('success', 'Reservation cancelled.');
                fetchData(); // Refresh the list
            } catch (err) {
                console.error("Error cancelling reservation:", err);
                showMessage('error', `Failed to cancel: ${err.message}`);
            }
        });
    };

    // Memoize processed reservations to avoid unnecessary re-calculations
    const processedReservations = useMemo(() => {
        return reservations.map(res => {
            const schedule = relatedData.schedules[res.schedule_id];
            const bus = relatedData.buses[res.bus_id];
            const route = schedule ? relatedData.routes[schedule.route_id] : null; // Ensure schedule exists before accessing its route_id
            return {
                ...res,
                routeName: route ? `${route.origin} → ${route.destination}` : 'N/A',
                busNumber: bus ? bus.bus_number : 'N/A',
                time: schedule ? `${schedule.departure_time} - ${schedule.arrival_time}` : 'N/A',
            };
        }).sort((a, b) => new Date(b.reservation_date) - new Date(a.reservation_date)); // Sort by date, newest first
    }, [reservations, relatedData]); // Recompute when reservations or relatedData changes

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }

    if (error) {
        return <ErrorDisplay onRetry={fetchData} />;
    }

    return (
        <div className="space-y-4">
            {processedReservations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">You have no reservations.</p>
            ) : (
                processedReservations.map(res => (
                    <ReservationCard key={res.$id} reservation={res} onCancel={handleCancelReservation} />
                ))
            )}
        </div>
    );
};

export default MyReservations;
