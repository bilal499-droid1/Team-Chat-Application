import { useState, useEffect } from 'react';
// Removed unused CreateProjectModal and PlusIcon imports
import api from '../../services/api';

const WelcomeBanner = ({ user }) => {
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedTasks: 0
  });

  useEffect(() => {
    const fetchWelcomeStats = async () => {
      try {
        const response = await api.get('/projects/stats');
        const data = response.data?.data || {};
        setStats({
          activeProjects: data.activeProjects || 0,
          completedTasks: data.completedTasks || 0
        });
      } catch (error) {
        console.error('Error fetching welcome stats:', error);
      }
    };

    fetchWelcomeStats();
  }, []);

  // Removed unused modal state and handler

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.fullName || user?.username || 'Muhammad'}! 👋
            </h1>
            <p className="text-blue-100 text-sm">
              You have {stats.activeProjects} active projects and {stats.completedTasks} completed tasks.
            </p>
          </div>
          {/* New Project button removed as requested */}
        </div>
      </div>
      {/* CreateProjectModal removed as requested */}
    </>
  );
};

export default WelcomeBanner;
