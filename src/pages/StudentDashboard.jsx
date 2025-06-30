// src/pages/StudentDashboard.jsx
import React from 'react';

const StudentDashboard = ({ currentUser, onLogout }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Student Dashboard
        </h2>
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-4">
            Welcome, <span className="font-semibold">{currentUser?.name || currentUser?.$id}</span>!
          </p>
          <p className="text-md text-gray-600 mb-6">
            User ID: <span className="font-mono text-sm bg-gray-100 p-1 rounded">{currentUser?.$id}</span>
          </p>
          <p className="text-gray-600 mb-8">
            This is your student dashboard. Polling features will be added here soon!
          </p>
          <button
            onClick={onLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;