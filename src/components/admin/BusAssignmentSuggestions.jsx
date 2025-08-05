// src/components/admin/BusAssignmentSuggestions.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../App';
import { dbApi } from '../../lib/appwrite/api';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

// Icons
import { CalendarIcon, ArrowRight, PowerOff, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

// Skeleton component for loading state
const SkeletonTable = () => (
    <div className="rounded-md border overflow-hidden animate-pulse">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]"><div className="h-4 bg-gray-200 rounded"></div></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 rounded"></div></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 rounded"></div></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 rounded"></div></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 rounded"></div></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 rounded"></div></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 rounded"></div></TableHead>
                    <TableHead><div className="h-4 bg-gray-200 rounded"></div></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><div className="h-4 bg-gray-200 rounded"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded"></div></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
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


const BusAssignmentSuggestions = () => {
    const { showMessage, showConfirmBox } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [allBuses, setAllBuses] = useState([]);
    const [allRoutes, setAllRoutes] = useState([]);
    const [allSchedules, setAllSchedules] = useState([]);
    const [allReservations, setAllReservations] = useState([]);

    const [selectedDate, setSelectedDate] = useState(new Date());

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [busesRes, routesRes, schedulesRes, reservationsRes] = await Promise.all([
                dbApi.getBuses(),
                dbApi.getRoutes(),
                dbApi.getSchedules(),
                dbApi.getAllReservations(),
            ]);

            setAllBuses(busesRes);
            setAllRoutes(routesRes);
            setAllSchedules(schedulesRes);
            setAllReservations(reservationsRes);

        } catch (err) {
            console.error("Error fetching data for suggestions:", err);
            setError("Failed to load data for suggestions. Check permissions or try again.");
            showMessage('error', `Failed to load data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    const suggestions = useMemo(() => {
        if (loading || !allBuses.length || !allRoutes.length || !allSchedules.length) {
            return [];
        }

        const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
        const dayOfWeek = format(selectedDate, 'EEE');
        const currentSuggestions = [];

        const operatingSchedules = allSchedules.filter(schedule => {
            if (!schedule.day_of_week) return false;
            const operatingDays = schedule.day_of_week.split(',').map(d => d.trim());
            return operatingDays.includes(dayOfWeek) || operatingDays.includes('Everyday');
        });

        const scheduleDemand = {};
        operatingSchedules.forEach(schedule => {
            const bookedCount = allReservations.filter(res =>
                res.schedule_id === schedule.$id &&
                res.reservation_date.startsWith(formattedSelectedDate) &&
                res.status === 'Booked'
            ).length;
            scheduleDemand[schedule.$id] = bookedCount;
        });

        const assignedBusIdsForToday = new Set(operatingSchedules.map(s => s.bus_id).filter(Boolean));
        const availableBuses = allBuses.filter(
            bus => bus.status === 'Active' && !assignedBusIdsForToday.has(bus.$id)
        );

        operatingSchedules.forEach(schedule => {
            const route = allRoutes.find(r => r.$id === schedule.route_id);
            if (!route) return;

            const currentBusForSchedule = allBuses.find(b => b.$id === schedule.bus_id);
            const demand = scheduleDemand[schedule.$id] || 0;
            
            if (currentBusForSchedule && currentBusForSchedule.status === 'Inactive') {
                currentSuggestions.push({ type: 'Activation Needed', reason: `Assigned Bus ${currentBusForSchedule.bus_number} is inactive.`, suggestedBus: currentBusForSchedule, schedule, route, currentBus: currentBusForSchedule, demand });
                return;
            }

            const isOverloaded = currentBusForSchedule && currentBusForSchedule.status === 'Active' && demand > currentBusForSchedule.capacity;
            if (isOverloaded) {
                const extraBus = availableBuses.find(b => b.capacity >= (demand - currentBusForSchedule.capacity));
                currentSuggestions.push({ type: 'Add Extra Bus', reason: 'Demand exceeds capacity. Add extra bus.', suggestedBus: extraBus || null, schedule, route, currentBus: currentBusForSchedule, demand });
                return;
            }

            const needsNewBus = !currentBusForSchedule || !currentBusForSchedule.bus_number;
            if (needsNewBus) {
                const bestFitActiveBus = availableBuses.filter(b => b.capacity >= demand).sort((a, b) => a.capacity - b.capacity)[0];

                if (bestFitActiveBus) {
                    currentSuggestions.push({ type: 'Assignment Needed', reason: 'No bus assigned.', suggestedBus: bestFitActiveBus, schedule, route, currentBus: currentBusForSchedule, demand });
                } else if (demand > 0) {
                    const inactiveBuses = allBuses.filter(b => b.status === 'Inactive');
                    const busToActivate = inactiveBuses.find(b => b.capacity >= demand);
                    
                    if (busToActivate) {
                        currentSuggestions.push({
                            type: 'Activation Needed',
                            reason: `No active buses available. Activate Bus ${busToActivate.bus_number}.`,
                            suggestedBus: busToActivate,
                            schedule,
                            route,
                            currentBus: null,
                            demand,
                        });
                    } else {
                        currentSuggestions.push({ type: 'Assignment Needed', reason: 'No suitable bus in fleet.', suggestedBus: null, schedule, route, currentBus: currentBusForSchedule, demand });
                    }
                } else {
                    currentSuggestions.push({ type: 'Assignment Needed', reason: 'No bus assigned.', suggestedBus: null, schedule, route, currentBus: currentBusForSchedule, demand });
                }
                return;
            }

            const isUnderutilized = currentBusForSchedule && demand < (currentBusForSchedule.capacity * 0.3);
            if (isUnderutilized) {
                 currentSuggestions.push({ type: 'Underutilized', reason: 'Bus is significantly underutilized.', suggestedBus: null, schedule, route, currentBus: currentBusForSchedule, demand });
            }
        });

        return currentSuggestions.sort((a, b) => {
            const typePriority = { 'Activation Needed': 1, 'Add Extra Bus': 2, 'Assignment Needed': 3, 'Underutilized': 4 };
            return (typePriority[a.type] || 5) - (typePriority[b.type] || 5);
        });

    }, [allBuses, allRoutes, allSchedules, allReservations, selectedDate, loading]);

    const handleActivateBus = async (busId, busNumber) => {
        showConfirmBox('Confirm Activation', `Are you sure you want to set Bus ${busNumber} to 'Active'?`, async () => {
            setLoading(true);
            try {
                await dbApi.updateBus(busId, { status: 'Active' });
                showMessage('success', `Bus ${busNumber} has been activated.`);
                fetchData();
            } catch (err) {
                console.error("Error activating bus:", err);
                showMessage('error', `Failed to activate bus: ${err.message}`);
            } finally {
                setLoading(false);
            }
        });
    };

    const handleAddExtraBus = async (originalSchedule, extraBus) => {
        showConfirmBox('Confirm Extra Bus', `Add Bus ${extraBus.bus_number} as an extra trip for the ${originalSchedule.departure_time} schedule on route ${allRoutes.find(r => r.$id === originalSchedule.route_id)?.origin}?`, async () => {
            setLoading(true);
            try {
                const newSchedulePayload = {
                    route_id: originalSchedule.route_id,
                    bus_id: extraBus.$id,
                    departure_time: originalSchedule.departure_time,
                    arrival_time: originalSchedule.arrival_time,
                    day_of_week: originalSchedule.day_of_week,
                };
                await dbApi.createSchedule(newSchedulePayload);
                
                const announcementMessage = `Due to high demand, an extra bus (Bus ${extraBus.bus_number}) has been added for the ${originalSchedule.departure_time} trip on ${format(selectedDate, 'PPP')}.`;
                await dbApi.createAnnouncement({ title: `Extra Bus Added`, message: announcementMessage, bus_id: extraBus.$id, route_id: originalSchedule.route_id, timestamp: new Date().toISOString(), is_active: true });
                
                showMessage('success', 'Extra bus scheduled and announcement created!');
                fetchData();
            } catch (err) {
                console.error("Error adding extra bus:", err);
                showMessage('error', `Failed to add extra bus: ${err.message}`);
            } finally {
                setLoading(false);
            }
        });
    };

    const handleAssignBus = async (scheduleId, busId, routeId, busNumber, routeOrigin, routeDestination) => {
        showConfirmBox('Confirm Assignment', `Are you sure you want to assign Bus ${busNumber} to route ${routeOrigin} to ${routeDestination} for this schedule?`, async () => {
            setLoading(true);
            try {
                await dbApi.updateSchedule(scheduleId, { bus_id: busId });
                await dbApi.updateBus(busId, { assigned_route_id: routeId });
                const busCapacity = allBuses.find(b => b.$id === busId)?.capacity || 'N/A';
                const announcementMessage = `For the trip on ${format(selectedDate, 'PPP')}, Bus ${busNumber} (Capacity: ${busCapacity}) has been assigned to the route from ${routeOrigin} to ${routeDestination}.`;
                await dbApi.createAnnouncement({ title: `Bus Assignment: ${routeDestination}`, message: announcementMessage, bus_id: busId, route_id: routeId, timestamp: new Date().toISOString(), is_active: true });
                showMessage('success', `Bus ${busNumber} assigned and announcement created!`);
                fetchData();
            } catch (err) {
                console.error("Error assigning bus:", err);
                showMessage('error', `Failed to assign bus: ${err.message}`);
            } finally {
                setLoading(false);
            }
        });
    };

    const handleDeactivateBus = async (busId, busNumber) => {
        showConfirmBox('Confirm Deactivation', `Are you sure you want to set Bus ${busNumber} to 'Inactive'? This will not unassign it from any routes.`, async () => {
            setLoading(true);
            try {
                // MODIFICATION: Only update the bus status to 'Inactive'.
                await dbApi.updateBus(busId, { status: 'Inactive' });
                
                showMessage('success', `Bus ${busNumber} is now set to Inactive.`);
                fetchData();
            } catch (err) {
                console.error("Error deactivating bus:", err);
                showMessage('error', `Failed to deactivate bus: ${err.message}`);
            } finally {
                setLoading(false);
            }
        });
    };
    
    if (loading && !suggestions.length) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Bus Assignment Suggestions</CardTitle>
                    <CardDescription>Review suggested bus assignments based on demand and manage current allocations.</CardDescription>
                </CardHeader>
                <CardContent><SkeletonTable /></CardContent>
            </Card>
        );
    }

    if (error) {
        return <ErrorDisplay message={error} onRetry={fetchData} />;
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Bus Assignment Suggestions</CardTitle>
                <CardDescription>Review suggested bus assignments based on demand and manage current allocations.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <Label className="block text-sm font-medium text-gray-700 mb-2">View Suggestions for Date:</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={`w-full md:w-1/2 justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>

                {suggestions.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No assignment suggestions for {format(selectedDate, 'PPP')}. All schedules seem optimally assigned.</p>
                ) : (
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Route</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Current Bus</TableHead>
                                    <TableHead>Demand / Capacity</TableHead>
                                    <TableHead>Suggested Bus</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suggestions.map((sug, index) => (
                                    <TableRow key={index} className={
                                        sug.type === 'Activation Needed' ? 'bg-red-50' :
                                        sug.type === 'Add Extra Bus' ? 'bg-purple-50' :
                                        sug.type === 'Assignment Needed' ? 'bg-blue-50' :
                                        'bg-yellow-50' // Underutilized
                                    }>
                                        <TableCell className="font-medium">{sug.type}</TableCell>
                                        <TableCell>{sug.route.origin} <ArrowRight className="inline h-3 w-3 mx-1" /> {sug.route.destination}</TableCell>
                                        <TableCell>{sug.schedule.departure_time} - {sug.schedule.arrival_time}</TableCell>
                                        <TableCell>{sug.currentBus?.bus_number || 'None'}</TableCell>
                                        <TableCell>{sug.demand} / {sug.currentBus?.capacity || 'N/A'}</TableCell>
                                        <TableCell>
                                            {sug.suggestedBus ?
                                                `${sug.suggestedBus.bus_number} (Cap: ${sug.suggestedBus.capacity})` :
                                                'N/A'
                                            }
                                        </TableCell>
                                        <TableCell>{sug.reason}</TableCell>
                                        <TableCell>
                                            {sug.type === 'Activation Needed' && sug.suggestedBus ? (
                                                <Button size="sm" onClick={() => handleActivateBus(sug.suggestedBus.$id, sug.suggestedBus.bus_number)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                    Activate Bus
                                                </Button>
                                            ) : sug.type === 'Add Extra Bus' && sug.suggestedBus ? (
                                                <Button size="sm" onClick={() => handleAddExtraBus(sug.schedule, sug.suggestedBus)} className="bg-purple-600 hover:bg-purple-700 text-white">Add Extra Bus</Button>
                                            ) : sug.type === 'Assignment Needed' && sug.suggestedBus ? (
                                                <Button size="sm" onClick={() => handleAssignBus(sug.schedule.$id, sug.suggestedBus.$id, sug.route.$id, sug.suggestedBus.bus_number, sug.route.origin, sug.route.destination)} className="bg-green-600 hover:bg-green-700 text-white">Assign</Button>
                                            ) : sug.type === 'Underutilized' && sug.currentBus ? (
                                                <Button size="sm" variant="destructive" onClick={() => handleDeactivateBus(sug.currentBus.$id, sug.currentBus.bus_number)} className="bg-orange-500 hover:bg-orange-600 text-white"><PowerOff className="h-4 w-4 mr-1" /> Deactivate</Button>
                                            ) : (
                                                <span className="text-gray-500 text-sm">No action</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default BusAssignmentSuggestions;
