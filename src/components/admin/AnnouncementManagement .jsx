import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { dbApi } from '../../lib/appwrite/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, PlusCircle, X, Loader2, Megaphone } from 'lucide-react';
import { format } from 'date-fns';

const AnnouncementFormModal = ({ isOpen, onClose, onSave, announcement, isSaving }) => {
    const [formData, setFormData] = useState({ title: '', message: '' });

    useEffect(() => {
        if (announcement) {
            setFormData({ title: announcement.title, message: announcement.message });
        } else {
            setFormData({ title: '', message: '' });
        }
    }, [announcement, isOpen]);

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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{announcement ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
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
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await dbApi.getAnnouncements();
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
        setEditingAnnouncement(null);
    };

    const handleSave = async (formData) => {
        setIsSaving(true);
        try {
            const dataToSave = { ...formData, date: new Date().toISOString() };
            if (editingAnnouncement) {
                await dbApi.updateAnnouncement(editingAnnouncement.$id, dataToSave);
                showMessage('success', 'Announcement updated!');
            } else {
                await dbApi.createAnnouncement(dataToSave);
                showMessage('success', 'Announcement posted!');
            }
            handleCloseModal();
            fetchAnnouncements();
        } catch (error) {
            showMessage('error', `Failed to save announcement: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id) => {
        showConfirmBox('Confirm Deletion', 'Are you sure you want to delete this announcement?', async () => {
            try {
                await dbApi.deleteAnnouncement(id);
                showMessage('success', 'Announcement deleted.');
                fetchAnnouncements();
            } catch (error) {
                showMessage('error', `Failed to delete: ${error.message}`);
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
                                    <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                                ) : announcements.length > 0 ? (
                                    announcements.map((item) => (
                                        <TableRow key={item.$id}>
                                            <TableCell className="font-medium">{item.title}</TableCell>
                                            <TableCell className="max-w-sm truncate">{item.message}</TableCell>
                                            <TableCell>{format(new Date(item.date), 'PPP')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.$id)}><Trash2 className="h-4 w-4" /></Button>
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
            <AnnouncementFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} announcement={editingAnnouncement} isSaving={isSaving} />
        </div>
    );
};

export default AnnouncementManagement;
