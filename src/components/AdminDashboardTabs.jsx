import React from "react";

// shadcn/ui components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import { Bus, Route, MapPin, Clock, Bookmark, Megaphone, Brain } from "lucide-react";

// Import the modular management components
import BusManagement from "./admin/BusManagement";
import RouteManagement from "./admin/RouteManagement";
import StopManagement from "./admin/StopManagement";
import ScheduleManagement from "./admin/ScheduleManagement";
import ReservationManagement from "./admin/ReservationManagement";
import AnnouncementManagement from "./admin/AnnouncementManagement ";
import BusAssignmentSuggestions from "./admin/BusAssignmentSuggestions";

const AdminDashboardTabs = () => {
  return (
    <Tabs defaultValue="buses" className="flex-grow flex flex-col">
      <div className="px-6 pt-4 bg-gray-50 border-b border-gray-200">
        <TabsList className="h-auto bg-transparent p-0 flex flex-wrap">
          <TabsTrigger
            value="buses"
            className="group relative px-4 py-3 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all duration-200 ease-in-out"
          >
            <Bus className="mr-2 h-5 w-5 transition-colors duration-200 group-data-[state=active]:text-indigo-500" />
            Manage Buses
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
          </TabsTrigger>

          <TabsTrigger
            value="routes"
            className="group relative px-4 py-3 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all duration-200 ease-in-out"
          >
            <Route className="mr-2 h-5 w-5 transition-colors duration-200 group-data-[state=active]:text-indigo-500" />
            Manage Routes
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
          </TabsTrigger>

          <TabsTrigger
            value="stops"
            className="group relative px-4 py-3 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all duration-200 ease-in-out"
          >
            <MapPin className="mr-2 h-5 w-5 transition-colors duration-200 group-data-[state=active]:text-indigo-500" />
            Manage Stops
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
          </TabsTrigger>

          <TabsTrigger
            value="schedules"
            className="group relative px-4 py-3 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all duration-200 ease-in-out"
          >
            <Clock className="mr-2 h-5 w-5 transition-colors duration-200 group-data-[state=active]:text-indigo-500" />
            Manage Schedules
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
          </TabsTrigger>

          <TabsTrigger
            value="assignments"
            className="group relative px-4 py-3 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all duration-200 ease-in-out"
          >
            <Brain className="mr-2 h-5 w-5 transition-colors duration-200 group-data-[state=active]:text-indigo-500" />
            Bus AI
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
          </TabsTrigger>
          <TabsTrigger
            value="reservations"
            className="group relative px-4 py-3 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all duration-200 ease-in-out"
          >
            <Bookmark className="mr-2 h-5 w-5 transition-colors duration-200 group-data-[state=active]:text-indigo-500" />
            Manage Reservations
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
          </TabsTrigger>
          <TabsTrigger
            value="announcements"
            className="group relative px-4 py-3 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold transition-all duration-200 ease-in-out"
          >
            <Megaphone className="mr-2 h-5 w-5 transition-colors duration-200 group-data-[state=active]:text-indigo-500" />
            Announcements
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-300 ease-out" />
          </TabsTrigger>
        </TabsList>
      </div>

      <main className="flex-grow p-6 bg-gray-50">
        <TabsContent value="buses">
          <BusManagement />
        </TabsContent>
        <TabsContent value="routes">
          <RouteManagement />
        </TabsContent>
        <TabsContent value="stops">
          <StopManagement />
        </TabsContent>
        <TabsContent value="schedules">
          <ScheduleManagement />
        </TabsContent>
        <TabsContent value="reservations">
          <ReservationManagement />
        </TabsContent>
        <TabsContent value="assignments">
          <BusAssignmentSuggestions />
        </TabsContent>
        <TabsContent value="announcements">
          <AnnouncementManagement />
        </TabsContent>
      </main>
    </Tabs>
  );
};

export default AdminDashboardTabs;
