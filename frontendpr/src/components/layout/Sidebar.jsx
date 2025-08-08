import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  FolderIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Messages', href: '/messages', icon: ChatBubbleLeftIcon },
    { name: 'Team', href: '/team', icon: UserGroupIcon },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ];

  const recentProjects = [
    { name: 'Website Redesign', color: 'bg-blue-500' },
    { name: 'Mobile App', color: 'bg-green-500' },
    { name: 'Marketing Campaign', color: 'bg-purple-500' },
  ];

  const isActive = (href) => location.pathname === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Close button for mobile */}
      <div className="flex items-center justify-between p-4 lg:hidden">
        <span className="text-gray-900 font-semibold text-lg">Menu</span>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon
                className={`mr-3 h-5 w-5 ${
                  isActive(item.href) ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Recent Projects Section */}
      <div className="px-4 py-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Recent Projects</h3>
          <button className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-2">
          {recentProjects.map((project, index) => (
            <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              <div className={`w-3 h-3 rounded-full ${project.color}`}></div>
              <span className="text-sm text-gray-700 truncate">{project.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade to Pro Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-center">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <span className="text-white text-lg">⚡</span>
          </div>
          <h4 className="text-white font-semibold text-sm mb-1">Upgrade to Pro</h4>
          <p className="text-blue-100 text-xs mb-3">Unlock all features</p>
          <button className="w-full bg-white text-blue-600 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white z-50">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
