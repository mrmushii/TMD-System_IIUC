// src/pages/AdminDashboard.jsx
//import React, { useState } from 'react';
// No need to import account here as we're not doing auth ops directly,
// only receiving currentUser and onLogout props from App.jsx

const AdminDashboard = ({ currentUser, onLogout }) => {
  // Removed: llmLoading, llmSuggestion states are no longer needed
  // Removed: message state specifically for LLM suggestions

  // Removed: handleSuggestBusAllocation function is no longer needed

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Admin Dashboard
        </h2>
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-4">
            Welcome, <span className="font-semibold">{currentUser?.name || currentUser?.$id}</span>!
          </p>
          
          {currentUser?.labels && currentUser.labels.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                  Roles: {currentUser.labels.join(', ')}
              </p>
          )}
          <p className="text-gray-600 mb-8">
            This is your admin dashboard. More features will be added here!
          </p>

          <button
            onClick={onLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300 ease-in-out mt-6"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;