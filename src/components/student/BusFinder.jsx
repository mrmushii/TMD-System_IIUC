import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../App'; // Adjust path as necessary
import { dbApi } from '../../lib/appwrite/api'; // Adjust path as necessary

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// Icons
import { CalendarIcon, Bus, Ticket, AlertCircle, RefreshCw, Loader2, MapPin, Search } from 'lucide-react';
import { format } from 'date-fns';

// --- Reusable Sub-components ---
const Highlight = ({ text = '', highlight = '' }) => {
    if (!highlight.trim() || !text) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-200 px-0 rounded font-bold text-gray-800">{part}</mark>
                ) : (
                    part
                )
            )}
        </span>
    );
};

const ScheduleCard = ({ schedule, onBook, isBooking, onHover, onLeave, searchQuery }) => (
    <Card 
        className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        onMouseEnter={() => onHover(schedule.routeDetails.$id)}
        onMouseLeave={onLeave}
    >
        <div>
            <CardHeader className="p-0 pb-3">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                    <Bus className="mr-2 h-5 w-5 text-indigo-500" />
                    {schedule.busDetails?.bus_number || 'N/A'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-2 text-sm">
                <p className="text-gray-600">
                    <span className="font-semibold text-gray-700">Route:</span>{' '}
                    <Highlight text={schedule.routeDetails?.origin} highlight={searchQuery} /> →{' '}
                    <Highlight text={schedule.routeDetails?.destination} highlight={searchQuery} />
                </p>
                {schedule.matchReason?.type === 'stop' && (
                    <p className="text-sm text-teal-600 font-medium flex items-start">
                        <MapPin className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" />
                        <span>Via <Highlight text={schedule.matchReason.text} highlight={searchQuery} /></span>
                    </p>
                )}
                <p className="text-gray-600"><span className="font-semibold text-gray-700">Time:</span> {schedule.departure_time} - {schedule.arrival_time}</p>
            </CardContent>
        </div>
        <Button
            onClick={() => onBook(schedule)}
            // FIX: Disable the button if there's no bus assigned to the schedule
            disabled={isBooking || !schedule.busDetails}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow-sm transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            {isBooking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
            {/* FIX: Change button text based on booking state or if a bus is assigned */}
            {isBooking ? 'Booking...' : (!schedule.busDetails ? 'Bus Not Assigned' : 'Book Seat')}
        </Button>
    </Card>
);

const ErrorDisplay = ({ message, onRetry }) => (
    <div className="text-center py-10 px-4 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-lg font-semibold text-red-800">Failed to Load Data</h3>
        <p className="mt-1 text-sm text-red-700">{message}</p>
        <Button onClick={onRetry} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
    </div>
);

const MapView = ({ stops, highlightedRouteId }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const layersRef = useRef({ markers: [], polylines: {} });

    useEffect(() => {
        const loadResource = (tag, attrs) => {
            if (document.querySelector(`${tag}[src="${attrs.src}"]`) || document.querySelector(`${tag}[href="${attrs.href}"]`)) {
                return Promise.resolve();
            }
            return new Promise((resolve, reject) => {
                const element = document.createElement(tag);
                Object.assign(element, attrs);
                element.onload = () => resolve();
                element.onerror = () => reject(new Error(`Failed to load resource: ${attrs.src || attrs.href}`));
                document.head.appendChild(element);
            });
        };

        const initMap = () => {
            if (window.L && mapRef.current && !mapInstance.current) {
                mapInstance.current = window.L.map(mapRef.current).setView([22.4637, 91.8037], 13);
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(mapInstance.current);
            }
        };

        loadResource('link', { rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', integrity: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=', crossOrigin: '' })
            .then(() => loadResource('script', { src: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', integrity: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=', crossOrigin: '' }))
            .then(() => initMap())
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (!mapInstance.current || !window.L) return;

        Object.values(layersRef.current.polylines).forEach(p => p.remove());
        layersRef.current.markers.forEach(m => m.remove());
        layersRef.current = { markers: [], polylines: {} };

        if (stops.length > 0) {
            const latLngs = [];
            stops.forEach(stop => {
                try {
                    const [lat, lng] = stop.location_coordinates.split(',').map(Number);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const marker = window.L.marker([lat, lng]).addTo(mapInstance.current).bindPopup(`<b>${stop.stop_name}</b>`).bindTooltip(stop.stop_name, { permanent: true, direction: 'top', offset: [0, -10], className: 'map-stop-label' });
                        layersRef.current.markers.push(marker);
                        latLngs.push([lat, lng]);
                    }
                } catch (e) { console.error("Invalid stop coordinates:", stop.location_coordinates); }
            });

            if (stops[0]?.route_id) {
                const polyline = window.L.polyline(latLngs, { color: 'blue', weight: 5 }).addTo(mapInstance.current);
                layersRef.current.polylines[stops[0].route_id] = polyline;
            }
            
            setTimeout(() => {
                mapInstance.current.invalidateSize();
                if (latLngs.length > 0) {
                    mapInstance.current.fitBounds(latLngs, { padding: [50, 50] });
                }
            }, 100);
        }
    }, [stops]);

    useEffect(() => {
        if (!mapInstance.current) return;
        Object.entries(layersRef.current.polylines).forEach(([routeId, polyline]) => {
            polyline.setStyle({ color: routeId === highlightedRouteId ? 'red' : 'blue', weight: routeId === highlightedRouteId ? 7 : 5 });
            if(routeId === highlightedRouteId) polyline.bringToFront();
        });
    }, [highlightedRouteId]);

    return <div ref={mapRef} className="h-full w-full"></div>;
};

// --- NEW: Today's Schedule Component ---
const TodaysScheduleCard = ({ schedule }) => {
    const [status, setStatus] = useState('Upcoming');

    useEffect(() => {
        const updateStatus = () => {
            const now = format(new Date(), 'HH:mm');
            if (now >= schedule.departure_time && now <= schedule.arrival_time) {
                setStatus('Live');
            } else if (now > schedule.arrival_time) {
                setStatus('Completed');
            } else {
                setStatus('Upcoming');
            }
        };

        updateStatus();
        const timer = setInterval(updateStatus, 60000); // Update every minute
        return () => clearInterval(timer);
    }, [schedule.departure_time, schedule.arrival_time]);

    const statusStyles = {
        Live: 'bg-green-100 text-green-800',
        Upcoming: 'bg-blue-100 text-blue-800',
        Completed: 'bg-gray-100 text-gray-700',
    };

    return (
        <Card className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
                <CardTitle className="text-base font-bold text-gray-800 flex items-center">
                    <Bus className="mr-2 h-5 w-5 text-indigo-500" />
                    {schedule.busDetails?.bus_number}
                </CardTitle>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
                    {status === 'Live' && <div className="h-2 w-2 mr-1.5 bg-green-500 rounded-full animate-pulse"></div>}
                    {status}
                </span>
            </div>
            <CardContent className="p-0 pt-3 text-sm">
                 <p className="text-gray-600">
                    <span className="font-semibold">Route:</span>{' '}
                    {schedule.routeDetails?.origin} → {schedule.routeDetails?.destination}
                </p>
                <p className="text-gray-600">
                    <span className="font-semibold">Time:</span>{' '}
                    {schedule.departure_time} - {schedule.arrival_time}
                </p>
            </CardContent>
        </Card>
    );
};

const TodaysSchedules = ({ schedules, buses, routes }) => {
    const todaysSchedules = useMemo(() => {
        const dayOfWeek = format(new Date(), 'EEE');
        return schedules
            .filter(s => {
                const operatingDays = s.day_of_week.split(',').map(day => day.trim());
                return operatingDays.includes(dayOfWeek) || operatingDays.includes('Everyday');
            })
            .map(s => ({
                ...s,
                routeDetails: routes.find(r => r.$id === s.route_id),
                busDetails: buses.find(b => b.$id === s.bus_id),
            }))
            .sort((a,b) => a.departure_time.localeCompare(b.departure_time));
    }, [schedules, buses, routes]);

    return (
        <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Today's Schedules</h3>
            {todaysSchedules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todaysSchedules.map(s => <TodaysScheduleCard key={s.$id} schedule={s} />)}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                    <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 font-medium">No buses are scheduled for today.</p>
                </div>
            )}
        </div>
    );
};


const BusFinder = ({ onReservationMade, routes: initialRoutes, schedules: initialSchedules, buses: initialBuses, stops: initialStops }) => {
    const { user, showMessage } = useAuth();
    const [routes, setRoutes] = useState(initialRoutes || []);
    const [schedules, setSchedules] = useState(initialSchedules || []);
    const [buses, setBuses] = useState(initialBuses || []);
    const [stops, setStops] = useState(initialStops || []);
    const [loading, setLoading] = useState(!initialRoutes);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedScheduleForBooking, setSelectedScheduleForBooking] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [highlightedRouteId, setHighlightedRouteId] = useState(null);

    const fetchAllBusData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [routesRes, schedulesRes, busesRes, stopsRes] = await Promise.all([
                dbApi.getRoutes(),
                dbApi.getSchedules(),
                dbApi.getBuses(),
                dbApi.getStops(),
            ]);
            setRoutes(routesRes);
            setSchedules(schedulesRes);
            setBuses(busesRes);
            setStops(stopsRes);
        } catch (err) {
            console.error("Error fetching bus data:", err);
            setError("Could not load bus data. You may not have permissions. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!initialRoutes) {
            fetchAllBusData();
        }
    }, []);

    const filteredSchedules = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const lowerCaseQuery = searchQuery.toLowerCase();
        const dayOfWeek = format(selectedDate, 'EEE');

        const routeIdToMatchReason = new Map();
        routes.forEach(route => {
            if (route.origin.toLowerCase().includes(lowerCaseQuery)) {
                routeIdToMatchReason.set(route.$id, { type: 'origin', text: route.origin });
            } else if (route.destination.toLowerCase().includes(lowerCaseQuery)) {
                routeIdToMatchReason.set(route.$id, { type: 'destination', text: route.destination });
            }
        });
        stops.forEach(stop => {
            if (stop.stop_name.toLowerCase().includes(lowerCaseQuery)) {
                if (!routeIdToMatchReason.has(stop.route_id)) {
                    routeIdToMatchReason.set(stop.route_id, { type: 'stop', text: stop.stop_name });
                }
            }
        });

        if (routeIdToMatchReason.size === 0) return [];

        return schedules
            .filter(schedule => {
                const isMatchingRoute = routeIdToMatchReason.has(schedule.route_id);
                if (!isMatchingRoute) return false;
                const operatingDays = schedule.day_of_week.split(',').map(day => day.trim());
                return operatingDays.includes(dayOfWeek) || operatingDays.includes('Everyday');
            })
            .map(schedule => ({
                ...schedule,
                routeDetails: routes.find(r => r.$id === schedule.route_id),
                busDetails: buses.find(b => b.$id === schedule.bus_id),
                matchReason: routeIdToMatchReason.get(schedule.route_id)
            }))
            .sort((a, b) => a.departure_time.localeCompare(b.departure_time));
    }, [searchQuery, selectedDate, schedules, routes, buses, stops]);

    const stopsForSelectedRoute = useMemo(() => {
        if (filteredSchedules.length > 0) {
            const routeIdToShow = highlightedRouteId || filteredSchedules[0].route_id;
            return stops.filter(stop => stop.route_id === routeIdToShow).sort((a, b) => a.sequence_no - b.sequence_no);
        }
        return [];
    }, [filteredSchedules, stops, highlightedRouteId]);

    const handleBookSeatClick = (schedule) => {
        setSelectedScheduleForBooking(schedule);
        setIsBookingModalOpen(true);
    };

    const handleConfirmBooking = async () => {
        if (!user || !selectedScheduleForBooking || !selectedDate || isBooking) return;

        // FIX: Add a guard clause to ensure a bus is assigned before proceeding.
        if (!selectedScheduleForBooking.busDetails) {
            showMessage('error', 'This schedule does not have a bus assigned and cannot be booked.');
            setIsBookingModalOpen(false);
            return;
        }

        setIsBooking(true);
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        try {
            const existingReservations = await dbApi.getReservationsByBusScheduleAndDate(selectedScheduleForBooking.busDetails.$id, selectedScheduleForBooking.$id, formattedDate);
            if (existingReservations.length >= selectedScheduleForBooking.busDetails.capacity) {
                showMessage('error', 'No seats available for this schedule.');
                setIsBooking(false);
                return;
            }
            await dbApi.createReservation({
                student_id: user.$id,
                bus_id: selectedScheduleForBooking.busDetails.$id,
                schedule_id: selectedScheduleForBooking.$id,
                reservation_date: formattedDate,
                status: 'Booked',
                booking_time: new Date().toISOString(),
            });
            showMessage('success', 'Seat reserved successfully!');
            setIsBookingModalOpen(false);
            onReservationMade();
        } catch (err) {
            console.error("Error booking seat:", err);
            showMessage('error', `Failed to book seat: ${err.message}`);
        } finally {
            setIsBooking(false);
        }
    };

    if (loading) return <div className="p-6 bg-white rounded-lg shadow-md animate-pulse h-96"></div>;
    if (error) return <ErrorDisplay message={error} onRetry={fetchAllBusData} />;

    return (
        <div className="space-y-6">
            <style>{`.map-stop-label { background-color: rgba(255, 255, 255, 0.85); border: 1px solid rgba(0, 0, 0, 0.2); border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; color: #333; box-shadow: 0 1px 3px rgba(0,0,0,0.1); white-space: nowrap; }`}</style>
            <Card className="bg-white rounded-xl shadow-md">
                 <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-800">Find & Book Your Bus</CardTitle>
                    <CardDescription>Search for a destination or stop, then select a date to find available buses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="search-input" className="font-semibold text-gray-700">Search Destination or Stop</Label>
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    id="search-input"
                                    placeholder="e.g., GEC Circle, Campus..."
                                    className="h-11 pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="font-semibold text-gray-700">Select Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-full justify-start text-left font-normal h-11">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {searchQuery ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Search Results for "{searchQuery}"</h3>
                        {filteredSchedules.length > 0 ? (
                            filteredSchedules.map(schedule => <ScheduleCard key={schedule.$id} schedule={schedule} onBook={handleBookSeatClick} isBooking={isBooking && selectedScheduleForBooking?.$id === schedule.$id} onHover={setHighlightedRouteId} onLeave={() => setHighlightedRouteId(null)} searchQuery={searchQuery} />)
                        ) : (
                            <p className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">No schedules found.</p>
                        )}
                    </div>
                    <div className="lg:col-span-2">
                        <div className="sticky top-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Route Map</h3>
                            <div className="bg-gray-200 rounded-xl overflow-hidden shadow-inner h-[60vh]">
                                <MapView stops={stopsForSelectedRoute} highlightedRouteId={highlightedRouteId} />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                 <TodaysSchedules schedules={schedules} buses={buses} routes={routes} />
            )}
            
            <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Confirm Your Booking</DialogTitle>
                        <DialogDescription>Review your trip details before confirming.</DialogDescription>
                    </DialogHeader>
                    {selectedScheduleForBooking && (
                        <div className="space-y-3 py-4 text-sm">
                            <p><span className="font-semibold text-gray-800">Bus:</span> {selectedScheduleForBooking.busDetails?.bus_number}</p>
                            <p><span className="font-semibold text-gray-800">Route:</span> {selectedScheduleForBooking.routeDetails?.origin} → {selectedScheduleForBooking.routeDetails?.destination}</p>
                            <p><span className="font-semibold text-gray-800">Time:</span> {selectedScheduleForBooking.departure_time} - {selectedScheduleForBooking.arrival_time}</p>
                            <p><span className="font-semibold text-gray-800">Date:</span> {format(selectedDate, 'PPP')}</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsBookingModalOpen(false)} disabled={isBooking}>Cancel</Button>
                        <Button type="button" onClick={handleConfirmBooking} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isBooking}>
                            {isBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirming...</> : 'Confirm Booking'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BusFinder;
