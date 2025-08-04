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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Icons
import { CalendarIcon, Bus, CheckCircle, XCircle, AlertCircle, RefreshCw, ArrowRight, PowerOff } from 'lucide-react'; // Added PowerOff icon
import { format, addDays } from 'date-fns';


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
    }, [selectedDate]); // Re-fetch when selected date changes

    const suggestions = useMemo(() => {
        if (!allBuses.length || !allRoutes.length || !allSchedules.length || !allReservations.length) {
            return [];
        }

        const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
        const dayOfWeek = format(selectedDate, 'EEEE');

        // 1. Calculate demand for each schedule on the selected date
        const scheduleDemand = {};
        allSchedules.forEach(schedule => {
            const isOperatingToday = schedule.day_of_week.split(',').includes(dayOfWeek) || schedule.day_of_week.includes('Everyday');
            if (isOperatingToday) {
                const bookedCount = allReservations.filter(res =>
                    res.schedule_id === schedule.$id &&
                    format(new Date(res.reservation_date), 'yyyy-MM-dd') === formattedSelectedDate &&
                    res.status === 'Booked'
                ).length;
                scheduleDemand[schedule.$id] = bookedCount;
            } else {
                scheduleDemand[schedule.$id] = 0; // Not operating today
            }
        });

        // 2. Categorize buses: Assigned to a schedule vs. Available (not assigned to any schedule)
        // A bus is "assigned" if its `assigned_route_id` is set.
        // A bus is "available" if its `assigned_route_id` is null AND its status is 'Active'.
        const currentlyAssignedBusesIds = new Set(allBuses.filter(b => b.assigned_route_id).map(b => b.$id));
        const availableBuses = allBuses.filter(b => !b.assigned_route_id && b.status === 'Active');

        // 3. Generate suggestions
        const currentSuggestions = [];

        allSchedules.forEach(schedule => {
            const route = allRoutes.find(r => r.$id === schedule.route_id);
            // Find the bus that is currently assigned to THIS specific schedule
            const currentBusForSchedule = allBuses.find(b => b.$id === schedule.bus_id);
            const demand = scheduleDemand[schedule.$id] || 0;

            if (!route) return; // Skip if route data is missing

            const isOperatingToday = schedule.day_of_week.split(',').includes(dayOfWeek) || schedule.day_of_week.includes('Everyday');

            if (isOperatingToday) {
                // Scenario: Schedule has no bus, or current bus is inactive/overloaded
                if (!currentBusForSchedule || currentBusForSchedule.status !== 'Active' || demand > (currentBusForSchedule.capacity * 0.9)) {
                    // Find a suitable available bus that is not already assigned to another route
                    const bestFitAvailableBus = availableBuses
                        .filter(b => !currentlyAssignedBusesIds.has(b.$id) && b.capacity >= demand) // Ensure it's truly available and fits demand
                        .sort((a, b) => a.capacity - b.capacity)[0]; // Smallest bus that fits

                    if (bestFitAvailableBus) {
                        currentSuggestions.push({
                            type: 'Assignment Needed',
                            schedule,
                            route,
                            currentBus: currentBusForSchedule, // Could be null or inactive
                            demand,
                            suggestedBus: bestFitAvailableBus,
                            reason: currentBusForSchedule ? (demand > (currentBusForSchedule.capacity * 0.9) ? 'Overloaded' : 'Bus not active') : 'No bus assigned',
                        });
                    } else if (!currentBusForSchedule) {
                        // No suitable available bus found, but schedule needs one
                        currentSuggestions.push({
                            type: 'Assignment Needed',
                            schedule,
                            route,
                            currentBus: null,
                            demand,
                            suggestedBus: null, // No bus found
                            reason: 'No suitable available bus found',
                        });
                    }
                } else if (currentBusForSchedule && demand < (currentBusForSchedule.capacity * 0.3) && availableBuses.length > 0) {
                    // Scenario: Assigned bus is underutilized and there are other available buses
                    currentSuggestions.push({
                        type: 'Underutilized',
                        schedule,
                        route,
                        currentBus: currentBusForSchedule,
                        demand,
                        suggestedBus: null, // No new bus suggested, but highlights underutilization
                        reason: 'Bus is underutilized',
                    });
                }
            }
        });

        return currentSuggestions.sort((a, b) => {
            // Sort by type (Assignment Needed first), then by demand
            if (a.type === 'Assignment Needed' && b.type !== 'Assignment Needed') return -1;
            if (a.type !== 'Assignment Needed' && b.type === 'Assignment Needed') return 1;
            return b.demand - a.demand;
        });

    }, [allBuses, allRoutes, allSchedules, allReservations, selectedDate]);


    const handleAssignBus = async (scheduleId, busId, routeId, busNumber, routeOrigin, routeDestination) => {
        showConfirmBox(
            'Confirm Assignment',
            `Are you sure you want to assign Bus ${busNumber} to route ${routeOrigin} to ${routeDestination}? This will update the bus's assigned route and create an announcement.`,
            async () => {
                setLoading(true);
                try {
                    // 1. Update the bus's assigned route (bus's assigned_route_id attribute)
                    await dbApi.updateBus(busId, { assigned_route_id: routeId });

                    // 2. Also update the schedule's bus_id to reflect the assignment
                    await dbApi.updateSchedule(scheduleId, { bus_id: busId });

                    // 3. Create an announcement
                    const announcementMessage = `Bus ${busNumber} (Capacity: ${allBuses.find(b => b.$id === busId)?.capacity || 'N/A'}) has been assigned to route ${routeOrigin} to ${routeDestination}.`;
                    await dbApi.createAnnouncement({
                        title: `Bus Assignment: ${routeDestination}`,
                        message: announcementMessage,
                        bus_id: busId,
                        route_id: routeId,
                        timestamp: new Date().toISOString(),
                        is_active: true
                    });

                    showMessage('success', `Bus ${busNumber} assigned and announcement created!`);
                    fetchData(); // Re-fetch data to update suggestions
                } catch (err) {
                    console.error("Error assigning bus:", err);
                    showMessage('error', `Failed to assign bus: ${err.message}`);
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    const handleDeactivateBus = async (busId, busNumber) => {
        showConfirmBox(
            'Confirm Deactivation',
            `Are you sure you want to set Bus ${busNumber} to 'Inactive' status? This will remove it from active assignments.`,
            async () => {
                setLoading(true);
                try {
                    await dbApi.updateBus(busId, { status: 'Inactive', assigned_route_id: null }); // Set status to Inactive and clear assignment
                    showMessage('success', `Bus ${busNumber} set to Inactive and unassigned.`);
                    fetchData(); // Re-fetch data to update suggestions
                } catch (err) {
                    console.error("Error deactivating bus:", err);
                    showMessage('error', `Failed to deactivate bus: ${err.message}`);
                } finally {
                    setLoading(false);
                }
            }
        );
    };


    if (loading) {
        // Render SkeletonTable when loading
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Bus Assignment Suggestions</CardTitle>
                    <CardDescription>
                        Review suggested bus assignments based on demand and manage current allocations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SkeletonTable />
                </CardContent>
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
                <CardDescription>
                    Review suggested bus assignments based on demand and manage current allocations.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Date Filter */}
                <div className="mb-6">
                    <Label className="block text-sm font-medium text-gray-700 mb-2">View Suggestions for Date:</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={`w-full md:w-1/2 justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {suggestions.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No assignment suggestions for {format(selectedDate, 'PPP')} or all buses are optimally assigned.</p>
                ) : (
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Route</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Current Bus</TableHead>
                                    <TableHead>Demand</TableHead>
                                    <TableHead>Suggested Bus</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suggestions.map((sug, index) => (
                                    <TableRow key={index} className={sug.type === 'Assignment Needed' ? 'bg-blue-50' : 'bg-yellow-50'}>
                                        <TableCell className="font-medium">{sug.type}</TableCell>
                                        <TableCell>{sug.route.origin} <ArrowRight className="inline h-3 w-3 mx-1" /> {sug.route.destination} ({sug.route.via || 'Direct'})</TableCell>
                                        <TableCell>{sug.schedule.departure_time} - {sug.schedule.arrival_time}</TableCell>
                                        <TableCell>{sug.currentBus?.bus_number || 'None'}</TableCell>
                                        <TableCell>{sug.demand}</TableCell>
                                        <TableCell>
                                            {sug.suggestedBus ?
                                                `${sug.suggestedBus.bus_number} (Cap: ${sug.suggestedBus.capacity})` :
                                                'N/A'
                                            }
                                        </TableCell>
                                        <TableCell>{sug.reason}</TableCell>
                                        <TableCell>
                                            {sug.type === 'Assignment Needed' && sug.suggestedBus ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAssignBus(
                                                        sug.schedule.$id,
                                                        sug.suggestedBus.$id,
                                                        sug.route.$id,
                                                        sug.suggestedBus.bus_number,
                                                        sug.route.origin,
                                                        sug.route.destination
                                                    )}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    Assign
                                                </Button>
                                            ) : sug.type === 'Underutilized' && sug.currentBus ? (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeactivateBus(sug.currentBus.$id, sug.currentBus.bus_number)}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                                >
                                                    <PowerOff className="h-4 w-4 mr-1" /> Deactivate Bus
                                                </Button>
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
