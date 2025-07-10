// src/components/student/StudentProfile.jsx
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo for potential future use, though not strictly needed for this file's current state
import { useAuth } from '../../App'; // Adjust path as necessary
import { dbApi } from '../../lib/appwrite/api'; // Adjust path as necessary

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';


// Icons
import { User, Edit, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

// --- Reusable Sub-components ---

const ProfileSkeleton = () => (
    <div className="animate-pulse">
        <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
        </div>
        <div className="mt-6 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
    </div>
);

const ErrorDisplay = ({ onRetry }) => (
    <div className="text-center py-8 px-4 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <h3 className="mt-2 text-md font-semibold text-red-800">Failed to Load Profile</h3>
        <p className="mt-1 text-sm text-red-700">There was a problem fetching your profile data.</p>
        <Button onClick={onRetry} className="mt-4 bg-red-600 hover:bg-red-700 text-white text-sm h-9">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
    </div>
);

const EditProfileModal = ({ isOpen, onClose, onSave, profile, isSaving }) => {
    const [formData, setFormData] = useState({ name: '', department: '' });

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                department: profile.department || ''
            });
        }
    }, [profile, isOpen]); // Re-initialize form data when profile or isOpen changes

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}> {/* shadcn Dialog handles its own rendering based on 'open' prop */}
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
                        <DialogDescription>Update your personal details.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="department">Department</Label>
                            <Input id="department" name="department" value={formData.department} onChange={handleChange} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


// --- Main StudentProfile Component ---
const StudentProfile = () => {
    const { user, showMessage } = useAuth();
    const [studentProfile, setStudentProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchStudentProfile = async () => {
        if (!user) return;
        setLoading(true);
        setError(false);
        try {
            const profile = await dbApi.getStudentProfileByUserId(user.$id);
            if (profile) {
                setStudentProfile(profile);
            } else {
                console.warn("No student profile found for user:", user.$id);
                // Create a temporary profile object for display or prompt user to create
                setStudentProfile({ name: user.name || user.email, department: 'Not Set', user_id: user.$id });
                showMessage('info', 'Please complete your profile information.');
            }
        } catch (err) {
            console.error("Error fetching student profile:", err);
            showMessage('error', `Failed to fetch profile: ${err.message}`);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentProfile();
    }, [user]); // Depend on user to refetch if user object changes

    const handleSaveChanges = async (formData) => {
        if (!studentProfile) return;
        setIsSaving(true);
        try {
            // Determine if we need to update an existing profile or create a new one
            if (studentProfile.$id) { // If profile has an Appwrite ID, it exists in DB
                await dbApi.updateStudentProfile(studentProfile.$id, formData);
            } else { // No Appwrite ID, so it's a new profile to create
                const newProfileData = { ...formData, user_id: user.$id };
                await dbApi.createStudentProfile(newProfileData);
            }
            showMessage('success', 'Profile updated successfully!');
            setIsEditModalOpen(false);
            await fetchStudentProfile(); // Refresh profile data to get the new $id if created
        } catch (err) {
            console.error("Error updating profile:", err);
            showMessage('error', `Failed to update profile: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (error) {
        return <ErrorDisplay onRetry={fetchStudentProfile} />;
    }

    return (
        <div>
            {studentProfile && (
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center ring-4 ring-teal-200">
                                <User className="h-8 w-8 text-teal-600" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-gray-800">{studentProfile.name || 'N/A'}</h4>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </div>
                    <div className="text-sm text-gray-700 space-y-2 pt-4 border-t">
                        <p><span className="font-semibold">Department:</span> {studentProfile.department || 'Not Set'}</p>
                        {/* Add more profile fields here as needed */}
                    </div>
                </div>
            )}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveChanges}
                profile={studentProfile}
                isSaving={isSaving}
            />
        </div>
    );
};

export default StudentProfile;
