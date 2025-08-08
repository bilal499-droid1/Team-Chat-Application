import { EyeIcon } from '@heroicons/react/24/outline';

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      user: { name: 'Sarah Wilson', avatar: 'SW' },
      action: 'completed task',
      target: 'User Authentication',
      project: 'E-commerce Website',
      time: '2 hours ago',
      type: 'task_completed'
    },
    {
      id: 2,
      user: { name: 'Tom Brown', avatar: 'TB' },
      action: 'added comment to',
      target: 'API Integration',
      project: 'Mobile App',
      time: '4 hours ago',
      type: 'comment'
    },
    {
      id: 3,
      user: { name: 'Emily Davis', avatar: 'ED' },
      action: 'uploaded file',
      target: 'Design Assets.zip',
      project: 'Marketing Campaign',
      time: '6 hours ago',
      type: 'file_upload'
    },
    {
      id: 4,
      user: { name: 'Chris Lee', avatar: 'CL' },
      action: 'created new task',
      target: 'Social Media Graphics',
      project: 'Marketing Campaign',
      time: '1 day ago',
      type: 'task_created'
    },
    {
      id: 5,
      user: { name: 'Alex Kim', avatar: 'AK' },
      action: 'joined project',
      target: 'Backend Development',
      project: 'E-commerce Website',
      time: '2 days ago',
      type: 'project_joined'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_completed':
        return '✅';
      case 'comment':
        return '💬';
      case 'file_upload':
        return '📎';
      case 'task_created':
        return '📝';
      case 'project_joined':
        return '👋';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'task_completed':
        return 'text-green-600';
      case 'comment':
        return 'text-blue-600';
      case 'file_upload':
        return 'text-purple-600';
      case 'task_created':
        return 'text-yellow-600';
      case 'project_joined':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
          <EyeIcon className="h-4 w-4" />
          <span>View all</span>
        </button>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              {/* User avatar */}
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-medium">{activity.user.avatar}</span>
              </div>
              
              {/* Activity content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{getActivityIcon(activity.type)}</span>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-900 font-medium">{activity.user.name}</span>
                    {' '}{activity.action}{' '}
                    <span className={`font-medium ${getActivityColor(activity.type)}`}>
                      {activity.target}
                    </span>
                    {' '}in{' '}
                    <span className="text-gray-600">{activity.project}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
