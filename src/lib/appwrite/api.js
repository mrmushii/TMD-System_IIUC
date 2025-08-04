// lib/appwrite/api.js

// Corrected: ID and Query are imported directly from 'appwrite'
// account, databases, and appwriteConfig are imported from './config'
import { ID, Query } from 'appwrite';
import { account, databases, appwriteConfig } from './config';

// --- Authentication API Calls ---
export const authApi = {
    /**
     * Logs in a user with email and password.
     * @param {string} email - User's email.
     * @param {string} password - User's password.
     * @returns {Promise<object>} Current user session.
     */
    login: async (email, password) => {
        return await account.createEmailPasswordSession(email, password);
    },

    /**
     * Registers a new user.
     * @param {string} email - User's email.
     * @param {string} password - User's password.
     * @param {string} name - User's name.
     * @returns {Promise<object>} New user object.
     */
    register: async (email, password, name) => {
        return await account.create(ID.unique(), email, password, name);
    },

    /**
     * Logs out the current user session.
     * @returns {Promise<void>}
     */
    logout: async () => {
        return await account.deleteSession('current');
    },

    /**
     * Gets the currently logged-in user's details.
     * @returns {Promise<object>} Current user object or throws error if not logged in.
     */
    getCurrentUser: async () => {
        return await account.get();
    }
};

// --- Database API Calls (CRUD for Entities) ---
export const dbApi = {
    // --- Bus Management ---
    /**
     * Creates a new bus entry.
     * @param {object} busData - { bus_number, capacity, status, assigned_route_id (optional) }
     * @returns {Promise<object>} Created bus document.
     */
    createBus: async (busData) => {
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.busesCollectionId,
            ID.unique(),
            busData
        );
    },

    /**
     * Fetches all bus entries.
     * @returns {Promise<object[]>} Array of bus documents.
     */
    getBuses: async () => {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.busesCollectionId
        );
        return response.documents;
    },

    /**
     * Updates an existing bus entry.
     * @param {string} busId - ID of the bus to update.
     * @param {object} busData - Updated bus data.
     * @returns {Promise<object>} Updated bus document.
     */
    updateBus: async (busId, busData) => {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.busesCollectionId,
            busId,
            busData
        );
    },

    /**
     * Deletes a bus entry.
     * @param {string} busId - ID of the bus to delete.
     * @returns {Promise<void>}
     */
    deleteBus: async (busId) => {
        return await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.busesCollectionId,
            busId
        );
    },

    // --- Route Management ---
    /**
     * Creates a new route entry.
     * @param {object} routeData - { origin, destination, via (optional), distance_km }
     * @returns {Promise<object>} Created route document.
     */
    createRoute: async (routeData) => {
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.routesCollectionId,
            ID.unique(),
            routeData
        );
    },

    /**
     * Fetches all route entries.
     * @param {string[]} [selectFields] - Optional array of fields to select (e.g., ['$id', 'origin', 'destination']).
     * @returns {Promise<object[]>} Array of route documents.
     */
    getRoutes: async (selectFields = []) => {
        const queries = [];
        if (selectFields.length > 0) {
            queries.push(Query.select(selectFields));
        }
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.routesCollectionId,
            queries
        );
        return response.documents;
    },

    /**
     * Updates an existing route entry.
     * @param {string} routeId - ID of the route to update.
     * @param {object} routeData - Updated route data.
     * @returns {Promise<object>} Updated route document.
     */
    updateRoute: async (routeId, routeData) => {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.routesCollectionId,
            routeId,
            routeData
        );
    },

    /**
     * Deletes a route entry.
     * @param {string} routeId - ID of the route to delete.
     * @returns {Promise<void>}
     */
    deleteRoute: async (routeId) => {
        return await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.routesCollectionId,
            routeId
        );
    },

    // --- Stop Management ---
    /**
     * Creates a new stop entry.
     * @param {object} stopData - { stop_name, location_coordinates, route_id, sequence_no }
     * @returns {Promise<object>} Created stop document.
     */
    createStop: async (stopData) => {
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.stopsCollectionId,
            ID.unique(),
            stopData
        );
    },

    /**
     * Fetches all stop entries.
     * @param {Array} [queries=[]] - Optional array of Appwrite Query objects (e.g., [Query.equal('route_id', 'someId')]).
     * @returns {Promise<object[]>} Array of stop documents.
     */
    getStops: async (queries = []) => {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.stopsCollectionId,
            queries
        );
        return response.documents;
    },

    /**
     * Updates an existing stop entry.
     * @param {string} stopId - ID of the stop to update.
     * @param {object} stopData - Updated stop data.
     * @returns {Promise<object>} Updated stop document.
     */
    updateStop: async (stopId, stopData) => {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.stopsCollectionId,
            stopId,
            stopData
        );
    },

    /**
     * Deletes a stop entry.
     * @param {string} stopId - ID of the stop to delete.
     * @returns {Promise<void>}
     */
    deleteStop: async (stopId) => {
        return await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.stopsCollectionId,
            stopId
        );
    },

    // --- Schedule Management ---
    /**
     * Creates a new schedule entry.
     * @param {object} scheduleData - { bus_id, route_id, departure_time, arrival_time, day_of_week (comma-separated string) }
     * @returns {Promise<object>} Created schedule document.
     */
    createSchedule: async (scheduleData) => {
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.schedulesCollectionId,
            ID.unique(),
            scheduleData
        );
    },

    /**
     * Fetches all schedule entries.
     * @returns {Promise<object[]>} Array of schedule documents.
     */
    getSchedules: async () => {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.schedulesCollectionId
        );
        return response.documents;
    },

    /**
     * Updates an existing schedule entry.
     * @param {string} scheduleId - ID of the schedule to update.
     * @param {object} scheduleData - Updated schedule data.
     * @returns {Promise<object>} Updated schedule document.
     */
    updateSchedule: async (scheduleId, scheduleData) => {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.schedulesCollectionId,
            scheduleId,
            scheduleData
        );
    },

    /**
     * Deletes a schedule entry.
     * @param {string} scheduleId - ID of the schedule to delete.
     * @returns {Promise<void>}
     */
    deleteSchedule: async (scheduleId) => {
        return await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.schedulesCollectionId,
            scheduleId
        );
    },

    // --- Student Profile Management ---
    /**
     * Creates a new student profile entry.
     * @param {object} profileData - { user_id, name, department, preferred_stop_id (optional), preferred_route_id (optional) }
     * @returns {Promise<object>} Created student profile document.
     */
    createStudentProfile: async (profileData) => {
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.studentProfilesCollectionId,
            ID.unique(),
            profileData
        );
    },

    /**
     * Fetches a student profile by user ID.
     * @param {string} userId - Appwrite user ID.
     * @returns {Promise<object|null>} Student profile document or null if not found.
     */
    getStudentProfileByUserId: async (userId) => {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.studentProfilesCollectionId,
            [Query.equal('user_id', userId)]
        );
        return response.documents.length > 0 ? response.documents[0] : null;
    },

    /**
     * Fetches all student profiles.
     * @returns {Promise<object[]>} Array of student profile documents.
     */
    getAllStudentProfiles: async () => {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.studentProfilesCollectionId
        );
        return response.documents;
    },

    /**
     * Updates an existing student profile entry.
     * @param {string} profileId - ID of the profile to update.
     * @param {object} profileData - Updated profile data.
     * @returns {Promise<object>} Updated profile document.
     */
    updateStudentProfile: async (profileId, profileData) => {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.studentProfilesCollectionId,
            profileId,
            profileData
        );
    },

    // --- Reservation Management ---
    /**
     * Creates a new reservation entry.
     * @param {object} reservationData - { student_id, bus_id, schedule_id, reservation_date, status }
     * @returns {Promise<object>} Created reservation document.
     */
    createReservation: async (reservationData) => {
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.reservationCollectionId,
            ID.unique(),
            reservationData
        );
    },
    /**
     * Fetches reservations for a specific student or with other queries.
     * @param {string} studentId - The ID of the student whose reservations to fetch.
     * @param {Array} [additionalQueries=[]] - Optional array of Appwrite Query objects.
     * @returns {Promise<object[]>} Array of reservation documents.
     */
    getReservations: async (studentId, additionalQueries = []) => {
        const queries = [Query.equal('student_id', studentId), ...additionalQueries];
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.reservationCollectionId,
            queries
        );
        return response.documents;
    },
    /**
     * Fetches all reservations (for admin use).
     * @returns {Promise<object[]>} Array of all reservation documents.
     */
    getAllReservations: async () => {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.reservationCollectionId
        );
        return response.documents;
    },
    /**
     * Fetches all reservations for a given bus and schedule on a specific date.
     * Used to calculate available seats.
     * @param {string} busId - ID of the bus.
     * @param {string} scheduleId - ID of the schedule.
     * @param {string} reservationDate - Date of reservation in YYYY-MM-DD format.
     * @returns {Promise<object[]>} Array of reservation documents.
     */
    getReservationsByBusScheduleAndDate: async (busId, scheduleId, reservationDate) => {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.reservationCollectionId,
            [
                Query.equal('bus_id', busId),
                Query.equal('schedule_id', scheduleId),
                Query.equal('reservation_date', reservationDate),
                Query.equal('status', 'Booked') // Only count 'Booked' reservations
            ]
        );
        return response.documents;
    },
    /**
     * Updates an existing reservation entry.
     * @param {string} reservationId - ID of the reservation to update.
     * @param {object} reservationData - Updated reservation data.
     * @returns {Promise<object>} Updated reservation document.
     */
    updateReservation: async (reservationId, reservationData) => {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.reservationCollectionId,
            reservationId,
            reservationData
        );
    },
    /**
     * Deletes a reservation entry.
     * @param {string} reservationId - ID of the reservation to delete.
     * @returns {Promise<void>}
     */
    deleteReservation: async (reservationId) => {
        return await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.reservationCollectionId,
            reservationId
        );
    },

     /**
     * Creates a new announcement.
     * @param {object} announcementData - { title, message, date }
     * @returns {Promise<object>} Created announcement document.
     */
    createAnnouncement: async (announcementData) => {
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.announcementsCollectionId, // Ensure this ID is in your config
            ID.unique(),
            announcementData
        );
    },

    /**
     * Fetches all announcements, sorted by most recent.
     * @returns {Promise<object[]>} Array of announcement documents.
     */
    getAnnouncements: async () => {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.announcementsCollectionId,
            [Query.orderDesc('$createdAt'), Query.limit(10)] // Get latest 10
        );
        return response.documents;
    },

    /**
     * Updates an existing announcement.
     * @param {string} announcementId - ID of the announcement to update.
     * @param {object} announcementData - Updated announcement data.
     * @returns {Promise<object>} Updated announcement document.
     */
    updateAnnouncement: async (announcementId, announcementData) => {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.announcementsCollectionId,
            announcementId,
            announcementData
        );
    },

    /**
     * Deletes an announcement.
     * @param {string} announcementId - ID of the announcement to delete.
     * @returns {Promise<void>}
     */
    deleteAnnouncement: async (announcementId) => {
        return await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.announcementsCollectionId,
            announcementId
        );
    },
};



