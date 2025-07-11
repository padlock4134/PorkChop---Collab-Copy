import React from 'react';

const Dashboard = () => (
  <div className="max-w-2xl mx-auto mt-10 bg-weatheredWhite p-8 rounded shadow">
    <h1 className="text-3xl font-retro mb-4">Welcome to PorkChop!</h1>
    <p className="mb-2">Get started by exploring the modules in the navigation bar:</p>
    <ul className="list-disc ml-6">
      <li>My Kitchen: Scan and manage your digital cupboard</li>
      <li>My Cook Book: Save and edit your favorite recipes</li>
      <li>Chefs' Corner: Connect with chefs and share ideas</li>
      <li>Culinary School: Learn new skills and techniques</li>
    </ul>
  </div>
);

export default Dashboard;
