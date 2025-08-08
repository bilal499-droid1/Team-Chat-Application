import { CalendarIcon, EyeIcon } from '@heroicons/react/24/outline';

const RecentProjects = () => {
  const projects = [
    {
      id: 1,
      name: 'E-commerce Website',
      description: 'Building a modern e-commerce platform with React and Node.js',
      progress: 75,
      dueDate: '2024-03-15',
      status: 'In Progress',
      members: [
        { name: 'John Doe', avatar: 'JD' },
        { name: 'Jane Smith', avatar: 'JS' },
        { name: 'Mike Johnson', avatar: 'MJ' }
      ]
    },
    {
      id: 2,
      name: 'Mobile App Development',
      description: 'React Native app for task management and team collaboration',
      progress: 45,
      dueDate: '2024-04-20',
      status: 'In Progress',
      members: [
        { name: 'Sarah Wilson', avatar: 'SW' },
        { name: 'Tom Brown', avatar: 'TB' }
      ]
    },
    {
      id: 3,
      name: 'Marketing Campaign',
      description: 'Q1 digital marketing campaign for product launch',
      progress: 90,
      dueDate: '2024-02-28',
      status: 'Review',
      members: [
        { name: 'Emily Davis', avatar: 'ED' },
        { name: 'Chris Lee', avatar: 'CL' },
        { name: 'Alex Kim', avatar: 'AK' }
      ]
    }
  ];

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
          <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-gray-900 font-medium mb-1">{project.name}</h3>
                <p className="text-gray-600 text-sm">{project.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600 text-xs">Progress</span>
                <span className="text-gray-900 text-xs font-medium">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressColor(project.progress)} transition-all duration-300`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              {/* Team members */}
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {project.members.slice(0, 3).map((member, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center"
                    >
                      <span className="text-white text-xs font-medium">{member.avatar}</span>
                    </div>
                  ))}
                  {project.members.length > 3 && (
                    <div className="w-8 h-8 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white text-xs">+{project.members.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Due date */}
              <div className="flex items-center space-x-1 text-gray-600 text-xs">
                <CalendarIcon className="h-3 w-3" />
                <span>Due {new Date(project.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentProjects;
