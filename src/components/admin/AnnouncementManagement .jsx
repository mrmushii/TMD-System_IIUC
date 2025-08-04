// src/components/admin/AnnouncementManagement.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App'; // Adjust path as necessary
import { dbApi } from '../../lib/appwrite/api'; // Adjust path as necessary

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'; // FIX: Added DialogDescription
import { Textarea } from '@/components/ui/textarea'; // For the message input

// Icons
import { Pencil, Trash2, PlusCircle, X, Loader2, Megaphone, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';


// Reusable Loading Spinner (defined here for self-containment)
const LoadingSpinner = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-white text-lg">Loading...</p>
    </div>
);


const AnnouncementFormModal = ({ isOpen, onClose, onSave, announcement, isSaving }) => {
    const [formData, setFormData] = useState({ title: '', message: '' });

    useEffect(() => {
        if (announcement) {
            setFormData({ title: announcement.title || '', message: announcement.message || '' });
        } else {
            setFormData({ title: '', message: '' });
        }
    }, [announcement, isOpen]); // Reset form data when announcement prop or modal visibility changes

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{announcement ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
                        <DialogDescription>
                            {announcement ? 'Update the details of this announcement.' : 'Create a new announcement to notify students.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                        </div>
                        <div>
                            <Label htmlFor="message">Message</Label>
                            <Textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={4} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="bg-indigo-600 text-white hover:bg-indigo-700">
                            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Announcement'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


const AnnouncementManagement = () => {
    const { showMessage, showConfirmBox } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null); // Holds the announcement being edited

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            // Use getAllAnnouncements to fetch all announcements for the admin view
            const data = await dbApi.getAllAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            showMessage('error', `Failed to fetch announcements: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleOpenModal = (announcement = null) => {
        setEditingAnnouncement(announcement);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAnnouncement(null); // Clear editing state
    };

    const handleSave = async (formData) => {
        setIsSaving(true);
        try {
            // dbApi.createAnnouncement already adds timestamp and is_active
            const dataToSave = {
                title: formData.title,
                message: formData.message,
                // bus_id and route_id are optional for general announcements
                // and are handled by BusAssignmentSuggestions for specific assignments
            };

            if (editingAnnouncement) {
                // If editing, update the existing announcement
                await dbApi.updateAnnouncement(editingAnnouncement.$id, dataToSave);
                showMessage('success', 'Announcement updated!');
            } else {
                // If creating new, call createAnnouncement
                await dbApi.createAnnouncement(dataToSave);
                showMessage('success', 'Announcement posted!');
            }
            handleCloseModal(); // Close modal on success
            fetchAnnouncements(); // Refresh the list
        } catch (error) {
            showMessage('error', `Failed to save announcement: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id) => {
        showConfirmBox('Confirm Deletion', 'Are you sure you want to delete this announcement?', async () => {
            setLoading(true); // Show loading during deletion
            try {
                await dbApi.deleteAnnouncement(id);
                showMessage('success', 'Announcement deleted.');
                fetchAnnouncements(); // Refresh the list
            } catch (error) {
                showMessage('error', `Failed to delete: ${error.message}`);
            } finally {
                setLoading(false);
            }
        });
    };

    return (
        <div className="animate-fade-in">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Manage Announcements</CardTitle>
                        <CardDescription>Post and manage announcements for students.</CardDescription>
                    </div>
                    <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => handleOpenModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> New Announcement
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8">Loading announcements...</TableCell></TableRow>
                                ) : announcements.length > 0 ? (
                                    announcements.map((item) => (
                                        <TableRow key={item.$id}>
                                            <TableCell className="font-medium">{item.title}</TableCell>
                                            <TableCell className="max-w-sm truncate">{item.message}</TableCell>
                                            <TableCell>{format(new Date(item.timestamp), 'PPP')}</TableCell> {/* Use item.timestamp */}
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)} title="Edit">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.$id)} title="Delete">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="text-center py-16">No announcements found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <style jsx="true">{`
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
            `}</style>
            <AnnouncementFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} announcement={editingAnnouncement} isSaving={isSaving} />
        </div>
    );
};

export default AnnouncementManagement;
