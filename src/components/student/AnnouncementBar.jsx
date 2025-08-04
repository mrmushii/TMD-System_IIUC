// src/components/student/AnnouncementBar.jsx
import React, { useState, useEffect } from 'react';
import { dbApi } from '../../lib/appwrite/api';
import { useAuth } from '../../App'; // Assuming useAuth is exported from App.jsx

// shadcn/ui components
import { Button } from '@/components/ui/button';

// Icons
import { Megaphone, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';


const AnnouncementBar = () => {
    const { showMessage, showConfirmBox } = useAuth(); // Destructure showConfirmBox from useAuth
    const [announcement, setAnnouncement] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLatestAnnouncement = async () => {
        setLoading(true);
        setError(null);
        try {
            const latestAnnouncement = await dbApi.getLatestAnnouncement();
            if (latestAnnouncement) {
                setAnnouncement(latestAnnouncement);
                setIsVisible(true); // Show the bar if there's an announcement
            } else {
                setAnnouncement(null);
                setIsVisible(false);
            }
        } catch (err) {
            console.error("Error fetching announcement:", err);
            setError("Failed to load announcements.");
            showMessage('error', `Failed to load announcements: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLatestAnnouncement();
        // Poll for new announcements every 30 seconds
        const interval = setInterval(fetchLatestAnnouncement, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleDismiss = async () => {
        if (announcement && announcement.$id) {
            // Added console.log to check if this function is triggered
            console.log("handleDismiss: Attempting to show confirmation box for dismissal.");
            showConfirmBox(
                'Dismiss Announcement',
                'Are you sure you want to dismiss this announcement? It will no longer appear.',
                async () => { // This is the onConfirm callback
                    try {
                        // Mark announcement as inactive in DB (soft delete)
                        await dbApi.updateAnnouncement(announcement.$id, { is_active: false });
                        setIsVisible(false);
                        showMessage('success', 'Announcement dismissed.');
                    } catch (err) {
                        console.error("Error dismissing announcement:", err);
                        showMessage('error', `Failed to dismiss announcement: ${err.message}`);
                    }
                },
                // Explicitly pass an onCancel callback for clarity, though not strictly needed for this bug
                () => {
                    console.log("Dismissal cancelled by user.");
                }
            );
        }
    };

    if (loading) {
        return (
            <div className="w-full bg-blue-100 py-2 px-4 flex items-center justify-center text-sm text-blue-800 animate-pulse">
                <Megaphone className="h-4 w-4 mr-2" /> Fetching latest announcement...
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full bg-red-100 py-2 px-4 flex items-center justify-center text-sm text-red-800">
                <X className="h-4 w-4 mr-2" /> {error}
            </div>
        );
    }

    if (!announcement || !isVisible) {
        return null; // Don't render if no active announcement or dismissed
    }

    const timeAgo = formatDistanceToNow(new Date(announcement.timestamp), { addSuffix: true });

    return (
        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 shadow-lg flex items-center justify-between animate-slide-down">
            <div className="flex items-center flex-grow">
                <Megaphone className="h-6 w-6 mr-3 flex-shrink-0" />
                <p className="font-semibold text-lg flex-grow">
                    {announcement.message}
                    <span className="block text-xs font-normal opacity-80 mt-0.5">
                        {timeAgo}
                    </span>
                </p>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss} // This is the button that triggers the confirmation dialog
                className="ml-4 flex-shrink-0 text-white hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
                <X className="h-5 w-5" />
            </Button>
            <style jsx="true">{`
                @keyframes slide-down {
                    0% { transform: translateY(-100%); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-down {
                    animation: slide-down 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default AnnouncementBar;
