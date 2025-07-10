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

// --- Reusable Sub-components ---

const SkeletonRow = () => (
    <TableRow className="animate-pulse">
        <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-full"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-1/4"></div></TableCell>
        <TableCell><div className="flex space-x-2"><div className="h-8 w-8 bg-gray-200 rounded-full"></div><div className="h-8 w-8 bg-gray-200 rounded-full"></div></div></TableCell>
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value) => {
        setFormData(prev => ({ ...prev, route_id: value }));
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
                            <div><Label htmlFor="stop_name">Stop Name</Label><Input id="stop_name" name="stop_name" value={formData.stop_name} onChange={handleChange} required /></div>
                            <div><Label htmlFor="sequence_no">Sequence No.</Label><Input id="sequence_no" name="sequence_no" type="number" value={formData.sequence_no} onChange={handleChange} required min="1" /></div>
                        </div>
                        <div>
                            <Label htmlFor="route_id">Route</Label>
                            <Select onValueChange={handleSelectChange} value={formData.route_id} required>
                                <SelectTrigger><SelectValue placeholder="Select a Route" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" disabled>Select a Route</SelectItem>
                                    {routes.map(route => (<SelectItem key={route.$id} value={route.$id}>{`${route.origin} → ${route.destination}`}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="location_coordinates">Location (Lat, Long)</Label>
                            <Input id="location_coordinates" name="location_coordinates" value={formData.location_coordinates} onChange={handleChange} placeholder="e.g., 22.345, 91.821" required />
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
            
            <style jsx global>{`
              @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
              @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-10px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
              .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
              .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default StopManagement;
