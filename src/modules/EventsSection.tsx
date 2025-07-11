import React from 'react';


const EventsSection = () => (
  <div className="events-section bg-weatheredWhite p-4 rounded shadow mb-6">
    <h3 className="font-bold text-lg mb-2 text-maineBlue">Upcoming Events</h3>
    <ul className="space-y-2">
      <li className="text-gray-500 italic">No events available.</li>
    </ul>
  </div>
);

export default EventsSection;
