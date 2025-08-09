import { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import { 
  FolderIcon, 
  PlayIcon, 
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const StatsGrid = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchStats = async () => {
    console.log('📊 Starting fetchStats...');
    try {
      // Fetch dashboard stats from optimized endpoint
      console.log('📊 Calling /projects/stats endpoint...');
      const response = await api.get('/projects/stats');
      console.log('📊 Stats endpoint response:', response.data);
      const data = response.data?.data || {};
      
      setStats({
        totalProjects: data.totalProjects || 0,
        activeProjects: data.activeProjects || 0,
        completedTasks: data.completedTasks || 0
      });
      console.log('📊 Stats updated:', {
        totalProjects: data.totalProjects || 0,
        activeProjects: data.activeProjects || 0,
        completedTasks: data.completedTasks || 0
      });
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      console.log('📊 Falling back to individual API calls...');
      // Fallback to individual API calls if stats endpoint fails
      try {
        // Fetch projects
        console.log('📊 Fetching projects individually...');
        const projectsResponse = await api.get('/projects');
        console.log('📊 Projects response:', projectsResponse.data);
        const projects = projectsResponse.data?.data?.projects || [];
        
        const totalProjects = projects.length;
        const activeProjects = projects.filter(project => project.status === 'active').length;

        // Fetch all tasks from all projects to count completed ones
        let completedTasks = 0;
        console.log('📊 Fetching tasks for each project...');
        for (const project of projects) {
          try {
            const tasksResponse = await api.get(`/tasks/project/${project._id}`);
            const tasks = tasksResponse.data?.data?.tasks || [];
            const doneTasks = tasks.filter(task => task.status === 'done');
            completedTasks += doneTasks.length;
            console.log(`📊 Project ${project.name}: ${doneTasks.length} done tasks`);
          } catch (error) {
            console.warn(`Could not fetch tasks for project ${project._id}`);
          }
        }

        console.log('📊 Final fallback stats:', { totalProjects, activeProjects, completedTasks });
        setStats({
          totalProjects,
          activeProjects,
          completedTasks
        });
      } catch (fallbackError) {
        console.error('❌ Error in fallback stats fetch:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000);
    
    // Listen for real-time socket events
    if (socket) {
      // Listen for project events
      socket.on('project-created', () => {
        console.log('📊 Project created - refreshing stats');
        fetchStats();
      });
      
      socket.on('project-updated', () => {
        console.log('📊 Project updated - refreshing stats');
        fetchStats();
      });
      
      socket.on('project-deleted', () => {
        console.log('📊 Project deleted - refreshing stats');
        fetchStats();
      });
      
      // Listen for task events
      socket.on('task-created', () => {
        console.log('📊 Task created - refreshing stats');
        fetchStats();
      });
      
      socket.on('task-updated', (data) => {
        console.log('📊 Task updated - refreshing stats');
        fetchStats();
      });
      
      socket.on('task-deleted', () => {
        console.log('📊 Task deleted - refreshing stats');
        fetchStats();
      });
    }
    
    return () => {
      clearInterval(interval);
      
      // Clean up socket listeners
      if (socket) {
        socket.off('project-created');
        socket.off('project-updated');
        socket.off('project-deleted');
        socket.off('task-created');
        socket.off('task-updated');
        socket.off('task-deleted');
      }
    };
  }, [socket]);

  const statsConfig = [
    {
      title: 'Total Projects',
      value: loading ? '...' : stats.totalProjects.toString(),
      change: '+12%',
      icon: FolderIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Projects',
      value: loading ? '...' : stats.activeProjects.toString(),
      change: '+2%',
      icon: PlayIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Completed Tasks',
      value: loading ? '...' : stats.completedTasks.toString(),
      change: '+24%',
      icon: CheckCircleIcon,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {statsConfig.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </div>
  );
};

export default StatsGrid;
