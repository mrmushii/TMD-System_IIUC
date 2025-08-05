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
import { CalendarIcon, ArrowRight, PowerOff } from 'lucide-react';
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
        <h3 className="mt-2 text-lg font-semibold text-red-800">Failed to Load Data</h3>
        <p className="mt-1 text-sm text-red-700">{message}</p>
        <Button onClick={onRetry} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
            Retry
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
    }, []); // Fetch data only once on component mount

    const suggestions = useMemo(() => {
        // FIX 1: Changed guard clause to not fail if reservations are empty.
        // We only need the core data to proceed.
        if (loading || !allBuses.length || !allRoutes.length || !allSchedules.length) {
            return [];
        }

        const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
        const dayOfWeek = format(selectedDate, 'EEEE');

        // Get all schedules operating on the selected date
        const operatingSchedules = allSchedules.filter(schedule =>
            schedule.day_of_week.split(',').map(d => d.trim()).includes(dayOfWeek) || schedule.day_of_week.includes('Everyday')
        );

        // 1. Calculate demand for each operating schedule on the selected date
        const scheduleDemand = {};
        operatingSchedules.forEach(schedule => {
            const bookedCount = allReservations.filter(res =>
                res.schedule_id === schedule.$id &&
                format(new Date(res.reservation_date), 'yyyy-MM-dd') === formattedSelectedDate &&
                res.status === 'Booked'
            ).length;
            scheduleDemand[schedule.$id] = bookedCount;
        });

        // FIX 2: Correctly determine assigned vs. available buses for the selected date
        // A bus is "assigned" if it's linked to any schedule operating today.
        const assignedBusIdsForToday = new Set(
            operatingSchedules
                .map(s => s.bus_id)
                .filter(id => id != null) // Filter out null/undefined bus_ids
        );

        // An "available" bus is active and NOT assigned to any schedule operating today.
        const availableBuses = allBuses.filter(
            bus => bus.status === 'Active' && !assignedBusIdsForToday.has(bus.$id)
        );

        // 3. Generate suggestions
        const currentSuggestions = [];
        operatingSchedules.forEach(schedule => {
            const route = allRoutes.find(r => r.$id === schedule.route_id);
            const currentBusForSchedule = allBuses.find(b => b.$id === schedule.bus_id);
            const demand = scheduleDemand[schedule.$id] || 0;

            if (!route) return; // Skip if route data is missing

            // Scenario: Schedule needs a bus (none assigned, assigned is inactive, or overloaded)
            const needsAssignment = !currentBusForSchedule || currentBusForSchedule.status !== 'Active' || demand > currentBusForSchedule.capacity;

            if (needsAssignment) {
                // Find the best-fit bus from the truly available ones
                const bestFitAvailableBus = availableBuses
                    .filter(b => b.capacity >= demand) // Fits the demand
                    .sort((a, b) => a.capacity - b.capacity)[0]; // Smallest bus that fits

                let reason = 'No bus assigned';
                if (currentBusForSchedule) {
                    if (currentBusForSchedule.status !== 'Active') reason = 'Bus not active';
                    else if (demand > currentBusForSchedule.capacity) reason = 'Overloaded';
                }

                currentSuggestions.push({
                    type: 'Assignment Needed',
                    schedule,
                    route,
                    currentBus: currentBusForSchedule,
                    demand,
                    suggestedBus: bestFitAvailableBus || null,
                    reason: bestFitAvailableBus ? reason : 'No suitable available bus',
                });

            } else if (currentBusForSchedule && demand < (currentBusForSchedule.capacity * 0.3)) {
                // Scenario: Assigned bus is significantly underutilized
                currentSuggestions.push({
                    type: 'Underutilized',
                    schedule,
                    route,
                    currentBus: currentBusForSchedule,
                    demand,
                    suggestedBus: null, // No new bus suggested, just highlights the issue
                    reason: 'Bus is significantly underutilized',
                });
            }
        });

        return currentSuggestions.sort((a, b) => {
            const typeA = a.type === 'Assignment Needed' ? 1 : 2;
            const typeB = b.type === 'Assignment Needed' ? 1 : 2;
            if (typeA !== typeB) return typeA - typeB;
            return b.demand - a.demand; // Sort by demand descending
        });

    }, [allBuses, allRoutes, allSchedules, allReservations, selectedDate, loading]);


    const handleAssignBus = async (scheduleId, busId, routeId, busNumber, routeOrigin, routeDestination) => {
        showConfirmBox(
            'Confirm Assignment',
            `Are you sure you want to assign Bus ${busNumber} to route ${routeOrigin} to ${routeDestination} for this schedule?`,
            async () => {
                setLoading(true);
                try {
                    // 1. Update the schedule's bus_id to reflect the assignment
                    await dbApi.updateSchedule(scheduleId, { bus_id: busId });

                    // Optional: You might still want to update the bus's main route
                    // if that's part of your business logic.
                    await dbApi.updateBus(busId, { assigned_route_id: routeId });

                    // 2. Create an announcement
                    const busCapacity = allBuses.find(b => b.$id === busId)?.capacity || 'N/A';
                    const announcementMessage = `For the trip on ${format(selectedDate, 'PPP')}, Bus ${busNumber} (Capacity: ${busCapacity}) has been assigned to the route from ${routeOrigin} to ${routeDestination}.`;
                    await dbApi.createAnnouncement({
                        title: `Bus Assignment: ${routeDestination}`,
                        message: announcementMessage,
                        bus_id: busId,
                        route_id: routeId,
                        timestamp: new Date().toISOString(),
                        is_active: true
                    });

                    showMessage('success', `Bus ${busNumber} assigned and announcement created!`);
                    fetchData(); // Re-fetch data to update UI
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
            `This will set Bus ${busNumber} to 'Inactive' and unassign it from ALL schedules. Are you sure?`,
            async () => {
                setLoading(true);
                try {
                    // FIX 3: Unassign the bus from all schedules that use it
                    const affectedSchedules = allSchedules.filter(s => s.bus_id === busId);
                    const updatePromises = affectedSchedules.map(s => dbApi.updateSchedule(s.$id, { bus_id: null }));
                    
                    await Promise.all(updatePromises);

                    // Now, update the bus status and clear its main route
                    await dbApi.updateBus(busId, { status: 'Inactive', assigned_route_id: null });
                    
                    showMessage('success', `Bus ${busNumber} is now Inactive and unassigned from ${affectedSchedules.length} schedule(s).`);
                    fetchData(); // Re-fetch data
                } catch (err) {
                    console.error("Error deactivating bus:", err);
                    showMessage('error', `Failed to deactivate bus: ${err.message}`);
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    // NOTE: The rest of your JSX rendering logic is excellent and does not need changes.
    // I am including it here for completeness.
    if (loading && !suggestions.length) { // Show skeleton only on initial load
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
                                onSelect={(date) => date && setSelectedDate(date)}
                                initialFocus
                            />
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
                                        <TableCell>{sug.demand} / {sug.currentBus?.capacity || 'N/A'}</TableCell>
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
                                                    <PowerOff className="h-4 w-4 mr-1" /> Deactivate
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