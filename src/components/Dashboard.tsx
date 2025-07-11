import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, BookOpenIcon, UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const ModuleButton = ({ to, icon, title, description, color }) => (
  <Link
    to={to}
    className={`flex flex-col items-center p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${color} text-center`}
  >
    <div className="mb-4 p-3 bg-white bg-opacity-20 rounded-full">
      {icon}
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
        icon={<SparklesIcon className="h-10 w-10 text-white" />}
        title="My Kitchen"
        description="Scan and manage your digital cupboard"
        color="bg-gradient-to-br from-orange-400 to-pink-500 text-white"
      />
      
      <ModuleButton
        to="/my-cookbook"
        icon={<BookOpenIcon className="h-10 w-10 text-white" />}
        title="My Cook Book"
        description="Share your favorite recipes with the community"
        color="bg-gradient-to-br from-green-400 to-blue-500 text-white"
      />
      
      <ModuleButton
        to="/chefs-corner"
        icon={<UserGroupIcon className="h-10 w-10 text-white" />}
        title="Chefs' Corner"
        description="Find local markets and connect with shoppers"
        color="bg-gradient-to-br from-purple-500 to-indigo-500 text-white"
      />
      
      <ModuleButton
        to="/culinary-school"
        icon={<AcademicCapIcon className="h-10 w-10 text-white" />}
        title="Culinary School"
        description="Learn new skills and techniques"
        color="bg-gradient-to-br from-yellow-400 to-red-400 text-white"
      />
    </div>
    
    <div className="mt-10 text-center text-gray-600">
      <p>Select a module to get started</p>
    </div>
  </div>
);

export default Dashboard;
