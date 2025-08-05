// data-seeder/clear.js
require('dotenv').config(); // Load environment variables from .env file

const { Client, Databases, Query } = require('node-appwrite'); // Added Query for listing documents

// --- Appwrite Configuration ---
const client = new Client();
client
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// --- Your Collection IDs (from .env) ---
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTIONS = {
    // List all collections you want to clear
    RESERVATIONS: process.env.APPWRITE_RESERVATIONS_COLLECTION_ID,
    SCHEDULES: process.env.APPWRITE_SCHEDULES_COLLECTION_ID,
    BUSES: process.env.APPWRITE_BUSES_COLLECTION_ID,
    ROUTES: process.env.APPWRITE_ROUTES_COLLECTION_ID,
    STUDENT_PROFILES: process.env.APPWRITE_STUDENT_PROFILES_COLLECTION_ID,
    ANNOUNCEMENTS: process.env.APPWRITE_ANNOUNCEMENT_COLLECTION_ID,
};

async function clearData() {
    console.log("Starting data clearing process...");

    // Basic validation for environment variables
    for (const key in COLLECTIONS) {
        if (!COLLECTIONS[key]) {
            console.error(`Error: Missing environment variable for collection ${key}. Please check your .env file.`);
            return;
        }
    }
    if (!process.env.APPWRITE_ENDPOINT || !process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY || !DATABASE_ID) {
        console.error("Error: Missing core Appwrite environment variables. Please check your .env file.");
        return;
    }

    // Define the order of deletion to respect dependencies (e.g., delete reservations before students/schedules)
    const deletionOrder = [
        COLLECTIONS.RESERVATIONS,
        COLLECTIONS.SCHEDULES,
        COLLECTIONS.BUSES,
        COLLECTIONS.ROUTES,
        COLLECTIONS.STUDENT_PROFILES,
        COLLECTIONS.ANNOUNCEMENTS,
    ];

    try {
        for (const collectionId of deletionOrder) {
            let documentsToDelete = [];
            let totalDeleted = 0;
            let offset = 0;
            const limit = 100; // Appwrite default limit for listDocuments

            console.log(`\nClearing collection: ${Object.keys(COLLECTIONS).find(key => COLLECTIONS[key] === collectionId)} (ID: ${collectionId})...`);

            // Fetch all documents in batches
            do {
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    collectionId,
                    [
                        Query.limit(limit),
                        Query.offset(offset)
                    ]
                );
                documentsToDelete = response.documents;

                if (documentsToDelete.length > 0) {
                    console.log(`  Found ${documentsToDelete.length} documents to delete (offset: ${offset})...`);
                    // Delete each document
                    for (const doc of documentsToDelete) {
                        await databases.deleteDocument(DATABASE_ID, collectionId, doc.$id);
                        totalDeleted++;
                    }
                    offset += documentsToDelete.length; // Update offset for next batch
                }
            } while (documentsToDelete.length === limit); // Continue if the last batch was full

            console.log(`Successfully deleted ${totalDeleted} documents from collection ${Object.keys(COLLECTIONS).find(key => COLLECTIONS[key] === collectionId)}.`);
        }
        console.log("\nAll specified collections cleared successfully!");

    } catch (error) {
        console.error("Error during data clearing:", error);
        if (error.response) {
            console.error("Appwrite API Error:", error.response.status, error.response.message, error.response.code);
            console.error("Appwrite API Error Data:", error.response.data);
        }
    }
}

clearData();
