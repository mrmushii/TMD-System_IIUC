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
import { Pencil, Trash2, PlusCircle, MapPin, X, Loader2 } from 'lucide-react';

// --- Predefined list of common stops and their coordinates ---
const predefinedStops = [
    // Existing Stops
    { name: 'IIUC Campus', coordinates: '22.492308, 91.717350' },
    { name: 'Kumira', coordinates: '22.4496, 91.8025' },
    { name: 'Bhatiari', coordinates: '22.442242, 91.736589' },
    { name: 'City Gate', coordinates: '22.3853, 91.7842' },
    { name: 'AK Khan', coordinates: '22.3789, 91.7908' },
    { name: 'GEC Circle', coordinates: '22.3590, 91.8211' },
    { name: '2 Number Gate', coordinates: '22.3639, 91.8249' },
    { name: 'Muradpur', coordinates: '22.3658, 91.8374' },
    { name: 'Chawkbazar', coordinates: '22.3524, 91.8344' },
    { name: 'New Market', coordinates: '22.3366, 91.8329' },
    { name: 'Agrabad', coordinates: '22.3276, 91.8083' },
    { name: 'Bahaddarhat', coordinates: '22.3675, 91.8491' },
    { name: 'Baroiyarhat', coordinates: '22.6583, 91.5458' },
    { name: 'Hathazari College', coordinates: '22.5080, 91.8095' },
    { name: 'Dider Market', coordinates: '22.3680, 91.8320' },
    { name: 'Miler matha', coordinates: '22.3600, 91.8150' },
    { name: 'Navy Hospital Gate', coordinates: '22.3550, 91.8100' },
    { name: 'BOT', coordinates: '22.3160, 91.8450' },
    { name: 'Shah Amanath', coordinates: '22.3080, 91.8430' },
    { name: 'Chatteswari', coordinates: '22.3555, 91.8155' },
    { name: 'Oxyzen', coordinates: '22.3880, 91.8340' },
    { name: 'Lucky Plaza', coordinates: '22.3595, 91.8220' },
    { name: 'Kaptai Rastar Matha', coordinates: '22.3750, 91.8550' },
    { name: 'KoibolyoDham', coordinates: '22.3755, 91.8255' },
    { name: 'CUET', coordinates: '22.4630, 91.9730' },
    { name: 'Brindrabanhat', coordinates: '22.3450, 91.8400' },
    { name: 'Kotwali', coordinates: '22.3500, 91.8300' },
    { name: 'Boropol', coordinates: '22.3810, 91.8200' },
    { name: 'Mayor goli', coordinates: '22.3605, 91.8235' },
    { name: 'Link Road', coordinates: '22.386616, 91.786014' },
];



const SkeletonRow = () => (
    <TableRow className="animate-pulse">
        <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-full"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-1/4"></div></TableCell>
        <TableCell><div className="flex justify-end space-x-2"><div className="h-8 w-8 bg-gray-200 rounded-full"></div><div className="h-8 w-8 bg-gray-200 rounded-full"></div></div></TableCell>
    </TableRow>
);

const StopFormModal = ({ isOpen, onClose, onSave, stop, routes, isSaving }) => {
    const [formData, setFormData] = useState({ stop_name: '', location_coordinates: '', route_id: 'none', sequence_no: '' });

    useEffect(() => {
        if (stop) {
            setFormData({
                stop_name: stop.stop_name,
                location_coordinates: stop.location_coordinates,
                route_id: stop.route_id || 'none',
                sequence_no: stop.sequence_no.toString()
            });
        } else {
            setFormData({ stop_name: '', location_coordinates: '', route_id: 'none', sequence_no: '' });
        }
    }, [stop, isOpen]);

    if (!isOpen) return null;

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    // NEW: Handler for when a predefined stop is selected
    const handleStopSelection = (selectedStopName) => {
        const selectedStop = predefinedStops.find(s => s.name === selectedStopName);
        if (selectedStop) {
            setFormData(prev => ({
                ...prev,
                stop_name: selectedStop.name,
                location_coordinates: selectedStop.coordinates,
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-lg m-4 animate-fade-in-down" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle>{stop ? 'Edit Stop' : 'Add New Stop'}</CardTitle>
                            <CardDescription>Fill in the stop details below.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" type="button" onClick={onClose} className="rounded-full"><X className="h-5 w-5" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="stop_name_select">Stop Name</Label>
                                {/* MODIFIED: Changed from Input to Select */}
                                <Select onValueChange={handleStopSelection} value={formData.stop_name}>
                                    <SelectTrigger id="stop_name_select"><SelectValue placeholder="Select a predefined stop" /></SelectTrigger>
                                    <SelectContent>
                                        {predefinedStops.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div><Label htmlFor="sequence_no">Sequence No.</Label><Input id="sequence_no" name="sequence_no" type="number" value={formData.sequence_no} onChange={(e) => handleSelectChange('sequence_no', e.target.value)} required min="1" /></div>
                        </div>
                        <div>
                            <Label htmlFor="route_id">Route</Label>
                            <Select onValueChange={(value) => handleSelectChange('route_id', value)} value={formData.route_id} required>
                                <SelectTrigger><SelectValue placeholder="Select a Route" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" disabled>Select a Route</SelectItem>
                                    {routes.map(route => (<SelectItem key={route.$id} value={route.$id}>{`${route.origin} → ${route.destination}`}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="location_coordinates">Location (Lat, Long)</Label>
                            {/* MODIFIED: Made read-only to prevent manual edits */}
                            <Input id="location_coordinates" name="location_coordinates" value={formData.location_coordinates} placeholder="Select a stop to populate" readOnly className="bg-gray-100" />
                        </div>
                    </CardContent>
                    <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700" disabled={isSaving}>
                            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : (stop ? 'Update Stop' : 'Add Stop')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


// --- Main StopManagement Component ---
const StopManagement = () => {
    const { showMessage, showConfirmBox } = useAuth();
    const [stops, setStops] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStop, setEditingStop] = useState(null);

    const routeMap = useMemo(() => {
        return routes.reduce((acc, route) => {
            acc[route.$id] = `${route.origin} → ${route.destination}`;
            return acc;
        }, {});
    }, [routes]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedStops, fetchedRoutes] = await Promise.all([
                dbApi.getStops(),
                dbApi.getRoutes(['$id', 'origin', 'destination'])
            ]);
            setStops(fetchedStops);
            setRoutes(fetchedRoutes);
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

    const handleOpenModal = (stop = null) => {
        setEditingStop(stop);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (isSaving) return;
        setIsModalOpen(false);
        setEditingStop(null);
    };

    const handleSaveStop = async (formData) => {
        setIsSaving(true);
        try {
            const dataToSave = {
                ...formData,
                sequence_no: parseInt(formData.sequence_no, 10),
            };

            if (editingStop) {
                await dbApi.updateStop(editingStop.$id, dataToSave);
                showMessage('success', 'Stop updated successfully!');
            } else {
                await dbApi.createStop(dataToSave);
                showMessage('success', 'Stop added successfully!');
            }
            handleCloseModal();
            fetchData();
        } catch (error) {
            console.error("Error saving stop:", error);
            showMessage('error', `Failed to save stop: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (stopId) => {
        showConfirmBox('Confirm Deletion', 'Are you sure you want to delete this stop?', async () => {
            try {
                await dbApi.deleteStop(stopId);
                showMessage('success', 'Stop deleted successfully!');
                fetchData();
            } catch (error) {
                console.error("Error deleting stop:", error);
                showMessage('error', `Failed to delete stop: ${error.message}`);
            }
        });
    };

    return (
        <div className="animate-fade-in">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Route Stops</CardTitle>
                        <CardDescription>Manage all bus stops along the routes.</CardDescription>
                    </div>
                    <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => handleOpenModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Stop
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Stop Name</TableHead>
                                    <TableHead>Coordinates</TableHead>
                                    <TableHead>Route</TableHead>
                                    <TableHead>Sequence</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                                ) : stops.length > 0 ? (
                                    stops.map((stop) => (
                                        <TableRow key={stop.$id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-gray-900">{stop.stop_name}</TableCell>
                                            <TableCell className="text-gray-600 font-mono text-sm">{stop.location_coordinates}</TableCell>
                                            <TableCell className="text-gray-600">{routeMap[stop.route_id] || 'N/A'}</TableCell>
                                            <TableCell className="text-gray-600 font-medium">{stop.sequence_no}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(stop)} className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(stop.$id)} className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-16">
                                            <div className="flex flex-col items-center space-y-4">
                                                <MapPin className="h-16 w-16 text-gray-300" />
                                                <h3 className="text-lg font-semibold text-gray-700">No stops found</h3>
                                                <p className="text-gray-500">Get started by adding your first stop.</p>
                                                <Button className="bg-indigo-600 text-white hover:bg-indigo-700 mt-2" onClick={() => handleOpenModal()}>
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Stop
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

            <StopFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveStop}
                stop={editingStop}
                routes={routes}
                isSaving={isSaving}
            />
            
            <style>{`
              @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
              @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-10px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
              .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
              .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default StopManagement;
