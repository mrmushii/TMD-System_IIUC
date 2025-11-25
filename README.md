# TMD - Transport Management Dashboard

A comprehensive web application for managing bus transportation systems in educational institutions. TMD provides separate dashboards for administrators and students, enabling efficient route management, schedule coordination, bus reservations, and real-time announcements.

## 🚀 Features

### Admin Dashboard
- **Route Management**: Create, update, and manage bus routes
- **Schedule Management**: Configure and maintain bus schedules
- **Bus Management**: Manage bus fleet information and assignments
- **Stop Management**: Add, edit, and organize bus stops
- **Reservation Management**: View and manage student reservations
- **Announcement System**: Create and publish announcements to students
- **Bus Assignment Suggestions**: AI-powered suggestions for optimal bus assignments
- **Usage Logging**: Track system usage and analytics

### Student Dashboard
- **Bus Finder**: Search and find available buses for routes
- **Reservation System**: Make and manage bus seat reservations
- **My Reservations**: View upcoming and past reservations
- **Student Profile**: Manage personal information and preferences
- **Announcements**: View real-time announcements from administrators
- **Responsive Design**: Accessible on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 with Vite
- **Backend & Database**: Appwrite
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, shadcn/ui
- **Routing**: React Router DOM v7
- **Form Handling**: React Hook Form with Zod validation
- **Date Management**: date-fns, react-day-picker
- **Icons**: Lucide React
- **Notifications**: Sonner (Toast notifications)
- **Build Tool**: Vite 7

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Appwrite Account** (for backend services)
  - Create a project at [appwrite.io](https://appwrite.io)
  - Set up a database with the required collections

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tmd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APPWRITE_URL=https://cloud.appwrite.io/v1
   VITE_APPWRITE_DATABASE_ID=your_database_id
   VITE_APPWRITE_ROUTES_COLLECTION_ID=your_routes_collection_id
   VITE_APPWRITE_SCHEDULES_COLLECTION_ID=your_schedules_collection_id
   VITE_APPWRITE_USAGE_LOG_COLLECTION_ID=your_usage_log_collection_id
   VITE_APPWRITE_BUSES_COLLECTION_ID=your_buses_collection_id
   VITE_APPWRITE_STOPS_COLLECTION_ID=your_stops_collection_id
   VITE_APPWRITE_RESERVATIONS_COLLECTION_ID=your_reservations_collection_id
   VITE_APPWRITE_STUDENT_PROFILES_COLLECTION_ID=your_student_profiles_collection_id
   VITE_APPWRITE_ANNOUNCEMENT_COLLECTION_ID=your_announcement_collection_id
   ```

4. **Configure Appwrite Collections**
   
   Ensure your Appwrite database has the following collections with appropriate permissions:
   - Routes
   - Schedules
   - Buses
   - Stops
   - Reservations
   - Student Profiles
   - Announcements
   - Usage Logs

5. **Set up Admin Users**
   
   In your Appwrite console, assign the `admin` label to user accounts that should have admin access.

## 🚀 Getting Started

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

3. **Register a new account**
   
   - Click "Register" to create a new student account
   - For admin access, add the `admin` label to the user in Appwrite console

4. **Login**
   
   Use your credentials to log in. The system will automatically redirect you to the appropriate dashboard based on your role.

## 📁 Project Structure

```
tmd/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images and other assets
│   ├── components/         # React components
│   │   ├── admin/         # Admin-specific components
│   │   ├── student/       # Student-specific components
│   │   └── ui/            # Reusable UI components (shadcn/ui)
│   ├── lib/
│   │   ├── appwrite/      # Appwrite configuration and API
│   │   │   ├── config.js  # Appwrite client configuration
│   │   │   └── api.js     # API functions
│   │   └── utils.js       # Utility functions
│   ├── pages/             # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── StudentDashboard.jsx
│   ├── App.jsx            # Main app component with routing
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles
├── data-seeder/           # Data seeding scripts
│   ├── seed.js            # Seed data script
│   └── clear.js           # Clear data script
├── vite.config.js         # Vite configuration
├── package.json           # Project dependencies
└── README.md              # This file
```

## 📜 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality

## 🌱 Data Seeding

The project includes a data seeder utility for populating the database with sample data.

1. **Navigate to the seeder directory**
   ```bash
   cd data-seeder
   ```

2. **Install seeder dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `data-seeder` directory with your Appwrite credentials.

4. **Run the seeder**
   ```bash
   node seed.js
   ```

5. **Clear seeded data (optional)**
   ```bash
   node clear.js
   ```

## 🔐 Authentication & Authorization

- **Authentication**: Handled through Appwrite's authentication service
- **Authorization**: Role-based access control using user labels
  - Users with `admin` label → Admin Dashboard
  - Users without `admin` label → Student Dashboard
- **Protected Routes**: Automatic redirection based on authentication status and role

## 🎨 UI Components

The project uses shadcn/ui components built on Radix UI primitives:
- Button, Card, Dialog, Form, Input, Label
- Select, Table, Tabs, Textarea
- Calendar, Popover
- Toast notifications (Sonner)

All components are customizable and follow modern design principles.

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 Development Notes

- The application uses React Context API for state management
- Environment variables are accessed via `import.meta.env`
- All API calls are centralized in `src/lib/appwrite/api.js`
- Form validation is handled using Zod schemas with React Hook Form

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues, questions, or contributions, please open an issue in the repository.

---

**Built with ❤️ using React and Appwrite**
