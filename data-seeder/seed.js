// data-seeder/seed.js
require('dotenv').config(); // Load environment variables from .env file

const { Client, Databases, ID, Query } = require('node-appwrite');
const { faker } = require('@faker-js/faker');
const { format, addDays } = require('date-fns');

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
    BUSES: process.env.APPWRITE_BUSES_COLLECTION_ID,
    ROUTES: process.env.APPWRITE_ROUTES_COLLECTION_ID,
    SCHEDULES: process.env.APPWRITE_SCHEDULES_COLLECTION_ID,
    STUDENT_PROFILES: process.env.APPWRITE_STUDENT_PROFILES_COLLECTION_ID,
    RESERVATIONS: process.env.APPWRITE_RESERVATIONS_COLLECTION_ID,
    ANNOUNCEMENTS: process.env.APPWRITE_ANNOUNCEMENT_COLLECTION_ID,
};

// --- Data Generation Parameters ---
const NUM_STUDENTS = 50;
const NUM_BUSES = 5;
const NUM_ROUTES = 10;
const NUM_SCHEDULES_PER_ROUTE = 3; // Per route
const DAYS_TO_SEED_RESERVATIONS = 7; // Seed reservations for the next 7 days

// Batching parameters
const BATCH_SIZE = 50; // Number of documents to create in one batch
const BATCH_DELAY_MS = 100; // Delay between batches in milliseconds

async function seedData() {
    console.log("Starting data seeding...");

    // Basic validation for environment variables
    for (const key in COLLECTIONS) {
        if (!COLLECTIONS[key]) {
            console.error(`Error: Missing environment variable for collection ${key} (e.g., APPWRITE_${key}_COLLECTION_ID). Please check your .env file.`);
            return;
        }
    }
    if (!process.env.APPWRITE_ENDPOINT || !process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY || !DATABASE_ID) {
        console.error("Error: Missing core Appwrite environment variables (ENDPOINT, PROJECT_ID, API_KEY, DATABASE_ID). Please check your .env file.");
        return;
    }

    try {
        // --- 1. Generate Dummy Students (and their profiles) ---
        const dummyStudentProfiles = [];
        console.log(`Creating ${NUM_STUDENTS} student profiles...`);
        for (let i = 0; i < NUM_STUDENTS; i++) {
            const studentData = {
                user_id: ID.unique(), // Simulated Appwrite user ID
                name: faker.person.fullName(),
                department: faker.commerce.department(),
            };
            const createdProfile = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.STUDENT_PROFILES,
                ID.unique(),
                studentData
            );
            dummyStudentProfiles.push(createdProfile);
        }
        if (dummyStudentProfiles.length === 0) {
            console.warn("Warning: No student profiles were created. Subsequent steps might fail.");
        }
        console.log(`Created ${dummyStudentProfiles.length} student profiles.`);

        // --- 2. Generate Dummy Buses ---
        const dummyBuses = [];
        console.log(`Creating ${NUM_BUSES} buses...`);
        for (let i = 0; i < NUM_BUSES; i++) {
            const busData = {
                bus_number: `IIUC-BUS-${100 + i}`,
                capacity: faker.number.int({ min: 30, max: 60 }),
                status: faker.helpers.arrayElement(['Active', 'Active', 'Active', 'Inactive', 'Maintenance']), // Weighted toward Active
                assigned_route_id: null,
            };
            const createdBus = await databases.createDocument(DATABASE_ID, COLLECTIONS.BUSES, ID.unique(), busData);
            dummyBuses.push(createdBus);
        }
        if (dummyBuses.length === 0) {
            console.error("Error: No buses were created. Aborting, as schedules depend on buses.");
            return;
        }
        console.log(`Created ${dummyBuses.length} buses.`);

        // --- 3. Generate Dummy Routes ---
        const dummyRoutes = [];
        const cities = ['Chawkbazar', 'GEC Circle', 'New Market', 'IIUC Campus', 'Bahaddarhat', 'Agrabad', 'Muradpur', 'Oxygen', 'Port Area'];
        console.log(`Creating ${NUM_ROUTES} routes...`);
        for (let i = 0; i < NUM_ROUTES; i++) {
            const origin = faker.helpers.arrayElement(cities);
            let destination = faker.helpers.arrayElement(cities);
            while (destination === origin) {
                destination = faker.helpers.arrayElement(cities);
            }
            const routeData = {
                origin,
                destination,
                via: faker.helpers.arrayElement(['Link Road', 'AK Khan', 'City Gate', 'Double Mooring', 'Lalkhan Bazar']),
                distance_km: faker.number.float({ min: 5, max: 30, precision: 0.1 }),
            };
            const createdRoute = await databases.createDocument(DATABASE_ID, COLLECTIONS.ROUTES, ID.unique(), routeData);
            dummyRoutes.push(createdRoute);
        }
        if (dummyRoutes.length === 0) {
            console.error("Error: No routes were created. Aborting, as schedules depend on routes.");
            return;
        }
        console.log(`Created ${dummyRoutes.length} routes.`);

        // --- 4. Generate Dummy Schedules ---
        const dummySchedules = [];
        const daysOfWeekOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Everyday'];
        const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
        console.log(`Creating schedules ( ${NUM_SCHEDULES_PER_ROUTE} per route )...`);

        for (const route of dummyRoutes) {
            for (let i = 0; i < NUM_SCHEDULES_PER_ROUTE; i++) {
                if (dummyBuses.length === 0) {
                    console.warn("Skipping schedule creation: Not enough buses available.");
                    break;
                }
                const departureTime = faker.helpers.arrayElement(timeSlots);
                let arrivalOptions = timeSlots.filter(t => t > departureTime);
                let arrivalTime = arrivalOptions.length > 0 ? faker.helpers.arrayElement(arrivalOptions) : null;
                if (!arrivalTime) {
                    const idx = timeSlots.indexOf(departureTime);
                    arrivalTime = timeSlots[idx + 1] || '21:00';
                }
                const dayOfWeek = faker.helpers.arrayElements(daysOfWeekOptions, { min: 1, max: 3 }).join(',');

                const scheduleData = {
                    bus_id: faker.helpers.arrayElement(dummyBuses).$id,
                    route_id: route.$id,
                    departure_time: departureTime,
                    arrival_time: arrivalTime,
                    day_of_week: dayOfWeek,
                };
                const createdSchedule = await databases.createDocument(DATABASE_ID, COLLECTIONS.SCHEDULES, ID.unique(), scheduleData);
                dummySchedules.push(createdSchedule);
            }
        }
        if (dummySchedules.length === 0) {
            console.warn("Warning: No schedules were created. Subsequent steps might be affected.");
        }
        console.log(`Created ${dummySchedules.length} schedules.`);


        // --- 5. Generate Dummy Reservations ---
        const allReservations = [];
        console.log(`Generating reservations for the next ${DAYS_TO_SEED_RESERVATIONS} days...`);
        if (dummySchedules.length === 0 || dummyStudentProfiles.length === 0) {
            console.warn("Skipping reservation generation: No schedules or student profiles available.");
        } else {
            for (let dayOffset = 0; dayOffset < DAYS_TO_SEED_RESERVATIONS; dayOffset++) {
                const currentDate = new Date();
                const futureDate = addDays(currentDate, dayOffset);
                const reservationDate = format(futureDate, 'yyyy-MM-dd');

                for (const schedule of dummySchedules) {
                    const foundBus = dummyBuses.find(b => b.$id === schedule.bus_id);
                    const busCapacity = foundBus && typeof foundBus.capacity === 'number' ? foundBus.capacity : 40;

                    const maxPossible = Math.round(busCapacity * faker.number.float({ min: 0.2, max: 1.2 }));
                    const numReservations = faker.number.int({ min: 0, max: Math.max(1, maxPossible) });

                    for (let j = 0; j < numReservations; j++) {
                        const randomStudent = faker.helpers.arrayElement(dummyStudentProfiles);
                        const bookingTime = faker.date.recent({ days: DAYS_TO_SEED_RESERVATIONS }).toISOString();
                        const reservationData = {
                            student_id: randomStudent.$id,
                            bus_id: schedule.bus_id,
                            schedule_id: schedule.$id,
                            reservation_date: reservationDate,
                            status: faker.helpers.arrayElement(['Booked', 'Booked', 'Booked', 'Cancelled', 'Boarded']),
                            booking_time: bookingTime,
                        };
                        allReservations.push(reservationData);
                    }
                }
            }

            console.log(`Persisting ${allReservations.length} reservations in batches...`);
            // Batch create reservations
            for (let i = 0; i < allReservations.length; i += BATCH_SIZE) {
                const batch = allReservations.slice(i, i + BATCH_SIZE);
                const promises = batch.map(data =>
                    databases.createDocument(DATABASE_ID, COLLECTIONS.RESERVATIONS, ID.unique(), data)
                );
                await Promise.all(promises);
                console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} of ${batch.length} reservations created.`);
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS)); // Add a small delay
            }
            console.log(`Created ${allReservations.length} total reservations.`);
        }


        // --- 6. Generate a few initial Announcements ---
        console.log("Creating initial announcements...");
        await databases.createDocument(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, ID.unique(), {
            title: "Welcome!",
            message: "Welcome to the IIUC Smart Bus System! We're here to make your commute easier.",
            timestamp: new Date().toISOString(),
            is_active: true,
        });
        await databases.createDocument(DATABASE_ID, COLLECTIONS.ANNOUNCEMENTS, ID.unique(), {
            title: "New Feature Alert!",
            message: "Check out our new bus assignment suggestions for admins!",
            timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
            is_active: true,
        });
        console.log("Initial announcements created.");


        console.log("\nData seeding complete! Remember to check your Appwrite console for created data.");

    } catch (error) {
        console.error("Error during data seeding:", error);
        if (error.response) {
            console.error("Appwrite API Error:", error.response.status, error.response.message, error.response.code);
            console.error("Appwrite API Error Data:", error.response.data);
        }
    }
}

seedData();