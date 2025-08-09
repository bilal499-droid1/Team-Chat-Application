import { useEffect, useState } from 'react';
import { CalendarIcon, EyeIcon } from '@heroicons/react/24/outline';
import { projectAPI } from '../../services/api';

const RecentProjects = () => {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectAPI.getProjects();
        // The backend returns { data: { projects: [...] } }
        const realProjects = response.data?.data?.projects || [];
        setProjects(realProjects.slice(0, 3));
      } catch (error) {
        setProjects([]);
        console.error('Error fetching recent projects:', error);
      }
    };
    fetchProjects();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress': return 'text-blue-600 bg-blue-50 border border-blue-200';
      case 'Review': return 'text-yellow-600 bg-yellow-50 border border-yellow-200';
      case 'Completed': return 'text-green-600 bg-green-50 border border-green-200';
      default: return 'text-gray-600 bg-gray-50 border border-gray-200';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
          <EyeIcon className="h-4 w-4" />
          <span>View all</span>
        </button>
      </div>
      
      <div className="p-6 space-y-4">
        {projects.map((project) => (
          <div key={project._id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-gray-900 font-medium mb-1">{project.name}</h3>
                <p className="text-gray-600 text-sm">{project.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status || 'N/A'}
              </span>
            </div>
            {/* Progress bar removed as requested */}
            <div className="flex items-center justify-between">
              {/* Team members */}
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {(project.members || []).slice(0, 3).map((member, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center"
                    >
                      <span className="text-white text-xs font-medium">{member.avatar || (member.user?.fullName ? member.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U')}</span>
                    </div>
                  ))}
                  {project.members && project.members.length > 3 && (
                    <div className="w-8 h-8 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white text-xs">+{project.members.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Due date */}
              <div className="flex items-center space-x-1 text-gray-600 text-xs">
                <CalendarIcon className="h-3 w-3" />
                <span>Due {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentProjects;
