import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../App'; // Adjust path as necessary
import { dbApi } from '../../lib/appwrite/api'; // Adjust path as necessary

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Icons
import { CalendarIcon, CheckCircle, XCircle, Trash2, Ticket, Users, Percent, Bus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

// --- Reusable Sub-components ---

const StatCard = ({ title, value, icon: Icon, color, loading }) => {
    if (loading) {
        return (
            <div className="bg-white p-5 rounded-xl shadow-md animate-pulse">
                <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-gray-200 h-12 w-12"></div>
                    <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-12"></div>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4">
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        Booked: 'bg-blue-100 text-blue-800 ring-blue-600/20',
        Cancelled: 'bg-red-100 text-red-800 ring-red-600/20',
        Boarded: 'bg-green-100 text-green-800 ring-green-600/20',
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const SkeletonRow = () => (
    <TableRow className="animate-pulse">
        <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-full"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-1/4"></div></TableCell>
        <TableCell><div className="flex space-x-2"><div className="h-8 w-8 bg-gray-200 rounded-full"></div><div className="h-8 w-8 bg-gray-200 rounded-full"></div></div></TableCell>
    </TableRow>
);


// --- Main ReservationManagement Component ---
const ReservationManagement = () => {
    const { showMessage, showConfirmBox } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [studentProfiles, setStudentProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date());
    const [filterStatus, setFilterStatus] = useState('All');

    // Memoized maps for efficient data lookup
    const studentMap = useMemo(() => studentProfiles.reduce((acc, s) => ({ ...acc, [s.user_id]: s.name }), {}), [studentProfiles]);
    const busMap = useMemo(() => buses.reduce((acc, b) => ({ ...acc, [b.$id]: b }), {}), [buses]);
    const scheduleMap = useMemo(() => schedules.reduce((acc, s) => ({ ...acc, [s.$id]: s }), {}), [schedules]);
    const routeMap = useMemo(() => routes.reduce((acc, r) => ({ ...acc, [r.$id]: r }), {}), [routes]);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [reservationsRes, busesRes, routesRes, schedulesRes, studentProfilesRes] = await Promise.all([
                    dbApi.getAllReservations(),
                    dbApi.getBuses(),
                    dbApi.getRoutes(),
                    dbApi.getSchedules(),
                    dbApi.getAllStudentProfiles()
                ]);
                setReservations(reservationsRes);
                setBuses(busesRes);
                setRoutes(routesRes);
                setSchedules(schedulesRes);
                setStudentProfiles(studentProfilesRes);
            } catch (error) {
                console.error("Error fetching data:", error);
                showMessage('error', `Failed to load dashboard data: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const filteredReservations = useMemo(() => {
        return reservations.filter(res => {
            const dateMatch = filterDate ? format(new Date(res.reservation_date), 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd') : true;
            const statusMatch = filterStatus !== 'All' ? res.status === filterStatus : true;
            return dateMatch && statusMatch;
        });
    }, [reservations, filterDate, filterStatus]);
    
    const seatUtilizationData = useMemo(() => {
        const dailySchedules = schedules.filter(s => {
            const dayOfWeek = format(filterDate, 'EEEE'); // e.g., "Monday"
            return s.day_of_week.includes(dayOfWeek);
        });

        return dailySchedules.map(schedule => {
            const bus = busMap[schedule.bus_id];
            if (!bus || bus.capacity <= 0) return null;

            const route = routeMap[schedule.route_id];
            const bookedCount = reservations.filter(res =>
                res.schedule_id === schedule.$id &&
                format(new Date(res.reservation_date), 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd') &&
                res.status === 'Booked'
            ).length;

            const percentage = (bookedCount / bus.capacity) * 100;
            return {
                id: schedule.$id,
                busNumber: bus.bus_number,
                routeName: route ? `${route.origin} → ${route.destination}` : 'N/A',
                time: `${schedule.departure_time} - ${schedule.arrival_time}`,
                bookedCount,
                totalCapacity: bus.capacity,
                percentage: Math.round(percentage),
            };
        }).filter(Boolean);
    }, [reservations, schedules, buses, routes, filterDate, busMap, routeMap, scheduleMap]);


    const handleUpdateStatus = (reservationId, newStatus) => {
        showConfirmBox(`Confirm Status Change`, `Change reservation to "${newStatus}"?`, async () => {
            try {
                await dbApi.updateReservation(reservationId, { status: newStatus });
                showMessage('success', `Status updated to ${newStatus}`);
                setReservations(prev => prev.map(r => r.$id === reservationId ? { ...r, status: newStatus } : r));
            } catch (error) {
                showMessage('error', `Failed to update status: ${error.message}`);
            }
        });
    };

    const handleDelete = (reservationId) => {
        showConfirmBox('Confirm Deletion', 'Permanently delete this reservation?', async () => {
            try {
                await dbApi.deleteReservation(reservationId);
                showMessage('success', 'Reservation deleted.');
                setReservations(prev => prev.filter(r => r.$id !== reservationId));
            } catch (error) {
                showMessage('error', `Failed to delete: ${error.message}`);
            }
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Bookings (Day)" value={filteredReservations.length} icon={Ticket} color="bg-blue-500" loading={loading} />
                <StatCard title="Boarded" value={filteredReservations.filter(r => r.status === 'Boarded').length} icon={Users} color="bg-green-500" loading={loading} />
                <StatCard title="Avg. Utilization (Day)" value={`${(seatUtilizationData.reduce((acc, curr) => acc + curr.percentage, 0) / (seatUtilizationData.length || 1)).toFixed(0)}%`} icon={Percent} color="bg-indigo-500" loading={loading} />
                <StatCard title="Cancelled" value={filteredReservations.filter(r => r.status === 'Cancelled').length} icon={XCircle} color="bg-red-500" loading={loading} />
            </div>

            {/* Reservations Table Card */}
            <Card>
                <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle>Reservations</CardTitle>
                        <CardDescription>All bookings for the selected date and status.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className="w-full md:w-[280px] justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{filterDate ? format(filterDate, "PPP") : <span>Pick a date</span>}</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus /></PopoverContent>
                        </Popover>
                        <Select onValueChange={setFilterStatus} value={filterStatus}>
                            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Statuses</SelectItem>
                                <SelectItem value="Booked">Booked</SelectItem>
                                <SelectItem value="Boarded">Boarded</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Bus</TableHead>
                                    <TableHead>Route</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                                ) : filteredReservations.length > 0 ? (
                                    filteredReservations.map(res => {
                                        const schedule = scheduleMap[res.schedule_id];
                                        const route = schedule ? routeMap[schedule.route_id] : null;
                                        return (
                                            <TableRow key={res.$id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium text-gray-900">{studentMap[res.student_id] || 'Unknown'}</TableCell>
                                                <TableCell className="text-gray-600">{busMap[res.bus_id]?.bus_number || 'N/A'}</TableCell>
                                                <TableCell className="text-gray-600">{route ? `${route.origin} → ${route.destination}` : 'N/A'}</TableCell>
                                                <TableCell className="text-gray-600">{schedule ? `${schedule.departure_time} - ${schedule.arrival_time}` : 'N/A'}</TableCell>
                                                <TableCell><StatusBadge status={res.status} /></TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-1">
                                                        {res.status === 'Booked' && <>
                                                            <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(res.$id, 'Boarded')} className="text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full" title="Mark Boarded"><CheckCircle className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleUpdateStatus(res.$id, 'Cancelled')} className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="Cancel Booking"><XCircle className="h-4 w-4" /></Button>
                                                        </>}
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(res.$id)} className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan={6} className="text-center py-16 text-gray-500">No reservations found for selected filters.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Seat Utilization Analytics */}
            <Card>
                <CardHeader>
                    <CardTitle>Seat Utilization Analytics</CardTitle>
                    <CardDescription>Overview of bus capacity for {filterDate ? format(filterDate, "PPP") : 'the selected date'}.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-200 rounded-xl h-40"></div>)}
                        </div>
                    ) : seatUtilizationData.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {seatUtilizationData.map(data => (
                                <div key={data.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-gray-800">{data.busNumber}</p>
                                            <p className="text-sm text-gray-500">{data.routeName}</p>
                                            <p className="text-sm text-gray-500">{data.time}</p>
                                        </div>
                                        <p className="font-bold text-lg text-indigo-600">{data.percentage}%</p>
                                    </div>
                                    <div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${data.percentage}%` }}></div>
                                        </div>
                                        <p className="text-right text-sm text-gray-600 mt-1">{data.bookedCount} / {data.totalCapacity} seats</p>
                                    </div>
                                    {data.percentage > 90 && <p className="text-xs text-red-600 font-semibold flex items-center"><AlertTriangle className="h-3 w-3 mr-1" /> Nearing Capacity</p>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-gray-500">No scheduled buses for this day.</p>
                    )}
                </CardContent>
            </Card>
            
            <style jsx global>{`
              @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
              .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ReservationManagement;
