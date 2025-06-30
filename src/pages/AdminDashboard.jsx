// src/pages/AdminDashboard.jsx
import React, { useState } from 'react';

const AdminDashboard = ({ currentUser, onLogout }) => {
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmSuggestion, setLlmSuggestion] = useState('');
  const [message, setMessage] = useState(''); // For messages specific to the dashboard

  // Function to handle bus allocation suggestion using Gemini API
  const handleSuggestBusAllocation = async () => {
    setLlmLoading(true);
    setLlmSuggestion('');
    setMessage('Generating suggestions...');

    // Mock poll data - in a real app, this would come from your Appwrite database
    const mockPollData = [
      { route: 'Chittagong City - Campus', studentCount: 120 },
      { route: 'Feni - Campus', studentCount: 45 },
      { route: 'Cox\'s Bazar - Campus', studentCount: 70 },
      { route: 'Comilla - Campus', studentCount: 30 },
      { route: 'Noakhali - Campus', studentCount: 55 },
    ];

    const prompt = `Given the following student poll data for bus routes, suggest the number of buses to allocate for each route. Assume each standard bus can accommodate approximately 50 students. Provide a clear, concise allocation plan.

    Poll Data:
    ${mockPollData.map(data => `- ${data.route}: ${data.studentCount} students`).join('\n')}

    Please provide the suggestions in a structured format, listing each route and the suggested number of buses.`;

    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { contents: chatHistory };
      const apiKey = ""; // This will be provided by the environment (e.g., Canvas)
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setLlmSuggestion(text);
        setMessage('Suggestions generated successfully!');
      } else {
        setLlmSuggestion('Could not generate suggestions. Please try again.');
        setMessage('Failed to generate suggestions.');
        console.error('Gemini API response issue:', result);
      }
    } catch (error) {
      setLlmSuggestion('An error occurred while contacting the AI. Please check your network or API key.');
      setMessage('Error contacting AI.');
      console.error('Error calling Gemini API:', error);
    } finally {
      setLlmLoading(false);
    }
  };

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
          <p className="text-md text-gray-600 mb-6">
            User ID: <span className="font-mono text-sm bg-gray-100 p-1 rounded">{currentUser?.$id}</span>
          </p>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Bus Allocation Suggestions</h3>
            <button
              onClick={handleSuggestBusAllocation}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition duration-300 ease-in-out mb-4"
              disabled={llmLoading}
            >
              {llmLoading ? 'Generating...' : '✨ Suggest Bus Allocations'}
            </button>

            {llmSuggestion && (
              <div className="bg-blue-50 p-4 rounded-lg text-left text-gray-800 text-sm whitespace-pre-wrap">
                <h4 className="font-semibold mb-2">AI Suggested Allocation:</h4>
                {llmSuggestion}
              </div>
            )}
             {message && !llmSuggestion && ( // Show message if no suggestion yet
              <p className={`mt-4 text-center text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </div>

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