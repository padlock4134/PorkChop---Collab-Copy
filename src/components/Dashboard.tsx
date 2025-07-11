import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, BookOpenIcon, UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const ModuleButton = ({ to, emoji, title, description, borderColor }) => (
  <Link
    to={to}
    className={`flex flex-col items-center p-6 rounded-lg border-4 ${borderColor} bg-white text-black hover:scale-105 transition-transform duration-200 text-center`}
  >
    <div className="mb-4 text-5xl">
      {emoji}
    </div>
    <h2 className="text-xl font-bold mb-2 font-retro">{title}</h2>
    <p className="text-sm">{description}</p>
  </Link>
);

const Dashboard = () => (
  <div className="max-w-4xl mx-auto mt-6">
    <h1 className="text-4xl font-retro mb-8 text-center text-maineBlue">Welcome to PorkChop!</h1>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ModuleButton
        to="/my-kitchen"
        emoji="🐟"
        title="My Kitchen"
        description="Scan and manage your digital cupboard"
        borderColor="border-seafoam"
      />
      
      <ModuleButton
        to="/my-cookbook"
        emoji="📖"
        title="My Cook Book"
        description="Share your favorite recipes with the community"
        borderColor="border-blue-400"
      />
      
      <ModuleButton
        to="/chefs-corner"
        emoji="🦐"
        title="Chefs' Corner"
        description="Find local markets and connect with shoppers"
        borderColor="border-red-400"
      />
      
      <ModuleButton
        to="/culinary-school"
        emoji="🍳"
        title="Culinary School"
        description="Learn new skills and techniques"
        borderColor="border-yellow-300"
      />
    </div>
    
    <div className="mt-10 text-center text-gray-600">
      <p>Select a module to get started</p>
    </div>
  </div>
);

export default Dashboard;
