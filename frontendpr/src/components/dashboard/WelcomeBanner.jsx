import { PlusIcon } from '@heroicons/react/24/outline';

const WelcomeBanner = ({ user }) => {
  const handleNewProject = () => {
    // TODO: Implement new project modal/navigation
    console.log('New project clicked');
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.fullName || user?.username || 'Muhammad'}! 👋
          </h1>
          <p className="text-blue-100 text-sm">
            You have 8 active projects and 142 completed tasks.
          </p>
        </div>
        
        <button
          onClick={handleNewProject}
          className="mt-4 sm:mt-0 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Project</span>
        </button>
      </div>
    </div>
  );
};

export default WelcomeBanner;
