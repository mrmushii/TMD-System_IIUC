import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App'; // Adjust path as necessary
import { dbApi } from '../../lib/appwrite/api'; // Adjust path as necessary

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Icons
import { Pencil, Trash2, PlusCircle, Route as RouteIcon, X, Loader2 } from 'lucide-react';

// --- Reusable Sub-components ---

const SkeletonRow = () => (
    <TableRow className="animate-pulse">
        <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
        <TableCell><div className="h-4 bg-gray-200 rounded w-1/4"></div></TableCell>
        <TableCell><div className="flex space-x-2"><div className="h-8 w-8 bg-gray-200 rounded-full"></div><div className="h-8 w-8 bg-gray-200 rounded-full"></div></div></TableCell>
    </TableRow>
);

const RouteFormModal = ({ isOpen, onClose, onSave, route, isSaving }) => {
    const [formData, setFormData] = useState({ origin: '', destination: '', via: '', distance_km: '' });

    useEffect(() => {
        if (route) {
            setFormData({
                origin: route.origin,
                destination: route.destination,
                via: route.via || '',
                distance_km: route.distance_km.toString()
            });
        } else {
            setFormData({ origin: '', destination: '', via: '', distance_km: '' });
        }
    }, [route, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
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
                            <CardTitle>{route ? 'Edit Route' : 'Add New Route'}</CardTitle>
                            <CardDescription>Fill in the route details below.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" type="button" onClick={onClose} className="rounded-full"><X className="h-5 w-5" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label htmlFor="origin">Origin</Label><Input id="origin" name="origin" value={formData.origin} onChange={handleChange} required /></div>
                            <div><Label htmlFor="destination">Destination</Label><Input id="destination" name="destination" value={formData.destination} onChange={handleChange} required /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><Label htmlFor="via">Via (Optional)</Label><Input id="via" name="via" value={formData.via} onChange={handleChange} placeholder="e.g., Link Road" /></div>
                             <div><Label htmlFor="distance_km">Distance (km)</Label><Input id="distance_km" name="distance_km" type="number" value={formData.distance_km} onChange={handleChange} required step="0.1" min="0" /></div>
                        </div>
                    </CardContent>
                    <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700" disabled={isSaving}>
                            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : (route ? 'Update Route' : 'Add Route')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


// --- Main RouteManagement Component ---
const RouteManagement = () => {
    const { showMessage, showConfirmBox } = useAuth();
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState(null);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const fetchedRoutes = await dbApi.getRoutes();
            setRoutes(fetchedRoutes);
        } catch (error) {
            console.error("Error fetching routes:", error);
            showMessage('error', `Failed to fetch routes: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutes();
    }, []);

    const handleOpenModal = (route = null) => {
        setEditingRoute(route);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (isSaving) return;
        setIsModalOpen(false);
        setEditingRoute(null);
    };

    const handleSaveRoute = async (formData) => {
        setIsSaving(true);
        try {
            const dataToSave = {
                ...formData,
                distance_km: parseFloat(formData.distance_km),
            };

            if (editingRoute) {
                await dbApi.updateRoute(editingRoute.$id, dataToSave);
                showMessage('success', 'Route updated successfully!');
            } else {
                await dbApi.createRoute(dataToSave);
                showMessage('success', 'Route added successfully!');
            }
            handleCloseModal();
            fetchRoutes(); // Refresh data
        } catch (error) {
            console.error("Error saving route:", error);
            showMessage('error', `Failed to save route: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (routeId) => {
        showConfirmBox('Confirm Deletion', 'Are you sure you want to delete this route?', async () => {
            try {
                await dbApi.deleteRoute(routeId);
                showMessage('success', 'Route deleted successfully!');
                fetchRoutes(); // Refresh data
            } catch (error) {
                console.error("Error deleting route:", error);
                showMessage('error', `Failed to delete route: ${error.message}`);
            }
        });
    };

    return (
        <div className="animate-fade-in">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Bus Routes</CardTitle>
                        <CardDescription>Define and organize all available bus routes.</CardDescription>
                    </div>
                    <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => handleOpenModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Route
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Origin</TableHead>
                                    <TableHead>Destination</TableHead>
                                    <TableHead>Via</TableHead>
                                    <TableHead>Distance</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                                ) : routes.length > 0 ? (
                                    routes.map((route) => (
                                        <TableRow key={route.$id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-gray-900">{route.origin}</TableCell>
                                            <TableCell className="font-medium text-gray-900">{route.destination}</TableCell>
                                            <TableCell className="text-gray-600">{route.via || 'N/A'}</TableCell>
                                            <TableCell className="text-gray-600">{route.distance_km} km</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(route)} className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(route.$id)} className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-16">
                                            <div className="flex flex-col items-center space-y-4">
                                                <RouteIcon className="h-16 w-16 text-gray-300" />
                                                <h3 className="text-lg font-semibold text-gray-700">No routes found</h3>
                                                <p className="text-gray-500">Get started by defining your first route.</p>
                                                <Button className="bg-indigo-600 text-white hover:bg-indigo-700 mt-2" onClick={() => handleOpenModal()}>
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Route
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

            <RouteFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveRoute}
                route={editingRoute}
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

export default RouteManagement;
