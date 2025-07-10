import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../App'; // Assuming App.jsx exports useAuth
import { dbApi } from '../../lib/appwrite/api'; // Your Appwrite API functions

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Icons
import { Pencil, Trash2, PlusCircle, Bus, X, Loader2 } from 'lucide-react';

// --- Reusable Sub-components ---

const StatusBadge = ({ status }) => {
    const styles = {
        Active: 'bg-green-100 text-green-800 ring-green-600/20',
        Maintenance: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
        Inactive: 'bg-gray-100 text-gray-800 ring-gray-600/20',
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${styles[status] || styles.Inactive}`}>{status}</span>;
};

const SkeletonRow = () => (
    <TableRow className="animate-pulse">
        <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-1/4"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-full"></div></TableCell>
        <TableCell><div className="flex space-x-2"><div className="h-8 w-8 bg-gray-200 rounded-full"></div><div className="h-8 w-8 bg-gray-200 rounded-full"></div></div></TableCell>
    </TableRow>
);

const BusFormModal = ({ isOpen, onClose, onSave, bus, routes, isSaving }) => {
    const [formData, setFormData] = useState({ bus_number: '', capacity: '', status: 'Active', assigned_route_id: 'none' });

    useEffect(() => {
        if (bus) {
            setFormData({
                bus_number: bus.bus_number,
                capacity: bus.capacity.toString(),
                status: bus.status,
                assigned_route_id: bus.assigned_route_id || 'none'
            });
        } else {
            setFormData({ bus_number: '', capacity: '', status: 'Active', assigned_route_id: 'none' });
        }
    }, [bus, isOpen]);

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
            <Card className="w-full max-w-lg m-4 animate-fade-in-down" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle>{bus ? 'Edit Bus' : 'Add New Bus'}</CardTitle>
                            <CardDescription>Fill in the details below.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" type="button" onClick={onClose} className="rounded-full"><X className="h-5 w-5" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="bus_number">Bus Number</Label><Input id="bus_number" name="bus_number" value={formData.bus_number} onChange={handleChange} required /></div>
                            <div><Label htmlFor="capacity">Capacity</Label><Input id="capacity" name="capacity" type="number" value={formData.capacity} onChange={handleChange} required min="1" /></div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select onValueChange={(value) => handleSelectChange('status', value)} value={formData.status}>
                                    <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="assigned_route_id">Assigned Route</Label>
                                <Select onValueChange={(value) => handleSelectChange('assigned_route_id', value)} value={formData.assigned_route_id}>
                                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {routes.map(route => (<SelectItem key={route.$id} value={route.$id}>{`${route.origin} to ${route.destination}`}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700" disabled={isSaving}>
                            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : (bus ? 'Update Bus' : 'Add Bus')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


// --- Main BusManagement Component ---
const BusManagement = () => {
    const { showMessage, showConfirmBox } = useAuth();
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBus, setEditingBus] = useState(null);

    const routeMap = useMemo(() => {
        return routes.reduce((acc, route) => {
            acc[route.$id] = `${route.origin} to ${route.destination} ${route.via ? `(via ${route.via})` : ''}`;
            return acc;
        }, {});
    }, [routes]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedBuses, fetchedRoutes] = await Promise.all([
                dbApi.getBuses(), 
                dbApi.getRoutes(['$id', 'origin', 'destination', 'via'])
            ]);
            setBuses(fetchedBuses);
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

    const handleOpenModal = (bus = null) => {
        setEditingBus(bus);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (isSaving) return; // Prevent closing while saving
        setIsModalOpen(false);
        setEditingBus(null);
    };

    const handleSaveBus = async (formData) => {
        setIsSaving(true);
        try {
            const dataToSave = {
                ...formData,
                capacity: parseInt(formData.capacity, 10),
                assigned_route_id: formData.assigned_route_id === "none" ? null : formData.assigned_route_id,
            };
            
            if (editingBus) {
                await dbApi.updateBus(editingBus.$id, dataToSave);
                showMessage('success', 'Bus updated successfully!');
            } else {
                await dbApi.createBus(dataToSave);
                showMessage('success', 'Bus added successfully!');
            }
            handleCloseModal();
            fetchData(); // Refresh data
        } catch (error) {
            console.error("Error saving bus:", error);
            showMessage('error', `Failed to save bus: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (busId) => {
        showConfirmBox('Confirm Deletion', 'Are you sure you want to delete this bus?', async () => {
            try {
                await dbApi.deleteBus(busId);
                showMessage('success', 'Bus deleted successfully!');
                fetchData(); // Refresh data
            } catch (error) {
                console.error("Error deleting bus:", error);
                showMessage('error', `Failed to delete bus: ${error.message}`);
            }
        });
    };

    return (
        <div className="animate-fade-in">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Bus Fleet</CardTitle>
                        <CardDescription>Manage all buses in the system.</CardDescription>
                    </div>
                    <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => handleOpenModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Bus
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bus Number</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assigned Route</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
                                ) : buses.length > 0 ? (
                                    buses.map((bus) => (
                                        <TableRow key={bus.$id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-gray-900">{bus.bus_number}</TableCell>
                                            <TableCell className="text-gray-600">{bus.capacity}</TableCell>
                                            <TableCell><StatusBadge status={bus.status} /></TableCell>
                                            <TableCell className="text-gray-600">{routeMap[bus.assigned_route_id] || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(bus)} className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(bus.$id)} className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-16">
                                            <div className="flex flex-col items-center space-y-4">
                                                <Bus className="h-16 w-16 text-gray-300" />
                                                <h3 className="text-lg font-semibold text-gray-700">No buses found</h3>
                                                <p className="text-gray-500">Get started by adding your first bus.</p>
                                                <Button className="bg-indigo-600 text-white hover:bg-indigo-700 mt-2" onClick={() => handleOpenModal()}>
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Bus
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

            <BusFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveBus}
                bus={editingBus}
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

export default BusManagement;
