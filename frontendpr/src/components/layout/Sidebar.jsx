import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { projectAPI } from '../../services/api';
import {
  HomeIcon,
  FolderIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Messages', href: '/messages', icon: ChatBubbleLeftIcon },
  ];

  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectAPI.getProjects();
        // The backend returns { data: { projects: [...] } }
        const projects = response.data?.data?.projects || [];
        setRecentProjects(projects.slice(0, 3));
      } catch (error) {
        console.error('Error fetching recent projects:', error);
      }
    };
    fetchProjects();
  }, []);

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
            <div key={project._id || index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || '#6366f1' }}></div>
              <span className="text-sm text-gray-700 truncate">{project.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade to Pro section removed as requested */}
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
