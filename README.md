# Easy way to use

For everyone's easy access:

Admin login- id: admin@gmail.com.

             pass: 00000000
          
User login- id: dummy1@gmail.com

            pass: 11111111

🚌 IIUC Smart Bus Route & Schedule Management System
Project Overview
The IIUC Smart Bus Route & Schedule Management System is a centralized and intelligent platform designed to streamline bus operations for administrators and provide a seamless experience for students. By leveraging a robust database and a modular application architecture, the system solves key problems such as student confusion over bus schedules and routes, inefficient bus allocation, and managing demand. The system also includes an innovative bus assignment algorithm and a dynamic announcement feature.

✨ Key Features
Student Panel
Bus Finder: Students can easily search for available buses by destination and date.

Seat Reservation: A reservation system allows students to book and manage seats on specific bus schedules.

My Reservations: A dedicated section to view and cancel upcoming and past trip reservations.

Dynamic Announcements: A real-time bar displays important announcements, such as bus assignments or route changes.

User Profile: Students can view and update their personal and academic details.

Admin Panel
Full CRUD Operations: Administrators have full control to create, read, update, and delete data for:

Buses (with capacity and status)

Routes (with origin, destination, and via points)

Stops (with location coordinates)

Schedules (with departure/arrival times and operating days)

Announcements (for real-time student communication)

Intelligent Bus Assignment: A smart algorithm analyzes reservation data to suggest bus assignments for routes with high demand or to identify underutilized buses.

Reservations Management: View, filter, and manage all student reservations.

Usage Analytics: Get insights into seat utilization and demand patterns to make informed decisions.

🚀 Technology Stack
Frontend: React.js

UI Framework: shadcn/ui with Tailwind CSS

State & Routing: React Context, React Router DOM

Notifications: sonner for elegant toasts and notifications

Form Management: react-hook-form with zod for validation

Backend: Appwrite BaaS

Authentication (Email/Password)

Database (Collections)

Realtime (for future live updates)

Data Seeding: Node.js with node-appwrite, dotenv, and @faker-js/faker for testing and development.

Date/Time Handling: date-fns

⚙️ Setup & Installation
Follow these steps to get a local copy of the project up and running.

1. Clone the Repository
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name


2. Install Dependencies
Navigate to both the main project folder and the data-seeder folder to install dependencies.

# In the main project directory
npm install

# In the data-seeder directory
cd data-seeder
npm install


3. Appwrite Backend Configuration
This project requires a self-hosted or cloud-hosted Appwrite instance. You need to create a project and the necessary collections.

Create a Project: In your Appwrite console, create a new project.

Create Collections: In your project's Database, create the following collections with their respective attributes and permissions:

buses

routes

stops

schedules

student_profiles

reservations

announcements

Set Permissions: For each collection, ensure Users have appropriate read/write access. For reservations and student_profiles, Users must have Create and Read permissions.

Create API Key: For the data seeder script, create an API key with databases.read and databases.write access.

4. Environment Variables
Create a .env file in the root of your project and another one in the data-seeder folder.

Root .env file:

VITE_APPWRITE_PROJECT_ID=YOUR_APPWRITE_PROJECT_ID
VITE_APPWRITE_URL=https://cloud.appwrite.io/v1 # or your self-hosted URL
VITE_APPWRITE_DATABASE_ID=YOUR_DATABASE_ID
VITE_APPWRITE_ROUTES_COLLECTION_ID=YOUR_ROUTES_COLLECTION_ID
VITE_APPWRITE_SCHEDULES_COLLECTION_ID=YOUR_SCHEDULES_COLLECTION_ID
VITE_APPWRITE_BUSES_COLLECTION_ID=YOUR_BUSES_COLLECTION_ID
VITE_APPWRITE_STOPS_COLLECTION_ID=YOUR_STOPS_COLLECTION_ID
VITE_APPWRITE_RESERVATIONS_COLLECTION_ID=YOUR_RESERVATIONS_COLLECTION_ID
VITE_APPWRITE_STUDENT_PROFILES_COLLECTION_ID=YOUR_STUDENT_PROFILES_COLLECTION_ID
VITE_APPWRITE_ANNOUNCEMENTS_COLLECTION_ID=YOUR_ANNOUNCEMENTS_COLLECTION_ID


data-seeder/.env file:

APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=YOUR_APPWRITE_PROJECT_ID
APPWRITE_API_KEY=YOUR_APPWRITE_API_KEY
APPWRITE_DATABASE_ID=YOUR_DATABASE_ID
APPWRITE_ROUTES_COLLECTION_ID=YOUR_ROUTES_COLLECTION_ID
APPWRITE_SCHEDULES_COLLECTION_ID=YOUR_SCHEDULES_COLLECTION_ID
APPWRITE_BUSES_COLLECTION_ID=YOUR_BUSES_COLLECTION_ID
APPWRITE_STOPS_COLLECTION_ID=YOUR_STOPS_COLLECTION_ID
APPWRITE_RESERVATIONS_COLLECTION_ID=YOUR_RESERVATIONS_COLLECTION_ID
APPWRITE_STUDENT_PROFILES_COLLECTION_ID=YOUR_STUDENT_PROFILES_COLLECTION_ID
APPWRITE_ANNOUNCEMENTS_COLLECTION_ID=YOUR_ANNOUNCEMENTS_COLLECTION_ID


Note: Do not commit your .env files to Git.

5. Seed the Database
To quickly populate your database with dummy data for testing the application's features:

# In the data-seeder directory
node seed.js


To clear all dummy data:

# In the data-seeder directory
node clear.js


6. Run the Application
# In the root project directory
npm run dev


The application will be available at http://localhost:5173.
