import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../App'; // Adjust path as necessary
import { dbApi } from '../../lib/appwrite/api'; // Adjust path as necessary

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Icons
import { Pencil, Trash2, PlusCircle, CalendarDays, X, Loader2 } from 'lucide-react';

// --- Reusable Sub-components ---

const SkeletonRow = () => (
    <TableRow className="animate-pulse">
        <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-full"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
        <TableCell><div className="flex space-x-2"><div className="h-8 w-8 bg-gray-200 rounded-full"></div><div className="h-8 w-8 bg-gray-200 rounded-full"></div></div></TableCell>
    </TableRow>
);

const DayOfWeekPicker = ({ selectedDays, onDayChange }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const handleDayClick = (day) => {
        const newSelectedDays = selectedDays.includes(day)
            ? selectedDays.filter(d => d !== day)
            : [...selectedDays, day];
        onDayChange(newSelectedDays);
    };

    return (
        <div className="space-y-2">
            <Label>Days of Week</Label>
            <div className="flex flex-wrap gap-2">
                {days.map(day => (
                    <Button
                        key={day}
                        type="button"
                        variant={selectedDays.includes(day) ? 'default' : 'outline'}
                        onClick={() => handleDayClick(day)}
                        className={`h-9 w-12 transition-all duration-200 ${selectedDays.includes(day) ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}
                    >
                        {day}
                    </Button>
                ))}
            </div>
        </div>
    );
};

const ScheduleFormModal = ({ isOpen, onClose, onSave, schedule, buses, routes, isSaving }) => {
    const [formData, setFormData] = useState({ bus_id: 'none', route_id: 'none', departure_time: '', arrival_time: '', day_of_week: [] });

    useEffect(() => {
        if (schedule) {
            setFormData({
                bus_id: schedule.bus_id || 'none',
                route_id: schedule.route_id || 'none',
                departure_time: schedule.departure_time,
                arrival_time: schedule.arrival_time,
                day_of_week: schedule.day_of_week ? schedule.day_of_week.split(',') : []
            });
        } else {
            setFormData({ bus_id: 'none', route_id: 'none', departure_time: '', arrival_time: '', day_of_week: [] });
        }
    }, [schedule, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-2xl m-4 animate-fade-in-down" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle>{schedule ? 'Edit Schedule' : 'Add New Schedule'}</CardTitle>
                            <CardDescription>Set the timings and days for a bus route.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" type="button" onClick={onClose} className="rounded-full"><X className="h-5 w-5" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="bus_id">Bus</Label>
                                <Select onValueChange={(value) => handleSelectChange('bus_id', value)} value={formData.bus_id} required>
                                    <SelectTrigger><SelectValue placeholder="Select a Bus" /></SelectTrigger>
                                    <SelectContent>
                                        {buses.map(bus => (<SelectItem key={bus.$id} value={bus.$id}>{bus.bus_number}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="route_id">Route</Label>
                                <Select onValueChange={(value) => handleSelectChange('route_id', value)} value={formData.route_id} required>
                                    <SelectTrigger><SelectValue placeholder="Select a Route" /></SelectTrigger>
                                    <SelectContent>
                                        {routes.map(route => (<SelectItem key={route.$id} value={route.$id}>{`${route.origin} → ${route.destination}`}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="departure_time">Departure Time</Label><Input id="departure_time" name="departure_time" type="time" value={formData.departure_time} onChange={handleChange} required /></div>
                            <div><Label htmlFor="arrival_time">Arrival Time</Label><Input id="arrival_time" name="arrival_time" type="time" value={formData.arrival_time} onChange={handleChange} required /></div>
                        </div>
                        <DayOfWeekPicker selectedDays={formData.day_of_week} onDayChange={(days) => handleSelectChange('day_of_week', days)} />
                    </CardContent>
                    <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700" disabled={isSaving || formData.day_of_week.length === 0}>
                            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : (schedule ? 'Update Schedule' : 'Add Schedule')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


// --- Main ScheduleManagement Component ---
const ScheduleManagement = () => {
    const { showMessage, showConfirmBox } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);

    const busMap = useMemo(() => buses.reduce((acc, b) => ({ ...acc, [b.$id]: b.bus_number }), {}), [buses]);
    const routeMap = useMemo(() => routes.reduce((acc, r) => ({ ...acc, [r.$id]: `${r.origin} → ${r.destination}` }), {}), [routes]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schedulesRes, busesRes, routesRes] = await Promise.all([
                dbApi.getSchedules(),
                dbApi.getBuses(),
                dbApi.getRoutes(['$id', 'origin', 'destination'])
            ]);
            setSchedules(schedulesRes);
            setBuses(busesRes);
            setRoutes(routesRes);
        } catch (error) {
            console.error("Error fetching data:", error);
            showMessage('error', `Failed to fetch data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (schedule = null) => {
        setEditingSchedule(schedule);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (isSaving) return;
        setIsModalOpen(false);
        setEditingSchedule(null);
    };

    const handleSaveSchedule = async (formData) => {
        if (formData.day_of_week.length === 0) {
            showMessage('error', 'Please select at least one day of the week.');
            return;
        }
        setIsSaving(true);
        try {
            const dataToSave = {
                ...formData,
                day_of_week: formData.day_of_week.join(','),
            };

            if (editingSchedule) {
                await dbApi.updateSchedule(editingSchedule.$id, dataToSave);
                showMessage('success', 'Schedule updated successfully!');
            } else {
                await dbApi.createSchedule(dataToSave);
                showMessage('success', 'Schedule added successfully!');
            }
            handleCloseModal();
            fetchData();
        } catch (error) {
            console.error("Error saving schedule:", error);
            showMessage('error', `Failed to save schedule: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (scheduleId) => {
        showConfirmBox('Confirm Deletion', 'Are you sure you want to delete this schedule?', async () => {
            try {
                await dbApi.deleteSchedule(scheduleId);
                showMessage('success', 'Schedule deleted successfully!');
                fetchData();
            } catch (error) {
                console.error("Error deleting schedule:", error);
                showMessage('error', `Failed to delete schedule: ${error.message}`);
            }
        });
    };

    return (
        <div className="animate-fade-in">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Bus Schedules</CardTitle>
                        <CardDescription>Set up and modify recurring bus schedules.</CardDescription>
                    </div>
                    <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => handleOpenModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Schedule
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bus</TableHead>
                                    <TableHead>Route</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Days</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                                ) : schedules.length > 0 ? (
                                    schedules.map((schedule) => (
                                        <TableRow key={schedule.$id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-gray-900">{busMap[schedule.bus_id] || 'N/A'}</TableCell>
                                            <TableCell className="text-gray-600">{routeMap[schedule.route_id] || 'N/A'}</TableCell>
                                            <TableCell className="text-gray-600">{`${schedule.departure_time} - ${schedule.arrival_time}`}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {schedule.day_of_week.split(',').map(day => (
                                                        <span key={day} className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">{day}</span>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(schedule)} className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(schedule.$id)} className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-16">
                                            <div className="flex flex-col items-center space-y-4">
                                                <CalendarDays className="h-16 w-16 text-gray-300" />
                                                <h3 className="text-lg font-semibold text-gray-700">No schedules found</h3>
                                                <p className="text-gray-500">Get started by creating your first schedule.</p>
                                                <Button className="bg-indigo-600 text-white hover:bg-indigo-700 mt-2" onClick={() => handleOpenModal()}>
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Schedule
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <ScheduleFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveSchedule}
                schedule={editingSchedule}
                buses={buses}
                routes={routes}
                isSaving={isSaving}
            />
            
            <style jsx global>{`
              @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
              @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-10px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
              .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
              .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ScheduleManagement;
