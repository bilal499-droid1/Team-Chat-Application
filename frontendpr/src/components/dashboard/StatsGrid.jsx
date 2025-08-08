import StatsCard from './StatsCard';
import { 
  FolderIcon, 
  PlayIcon, 
  CheckCircleIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const StatsGrid = () => {
  const stats = [
    {
      title: 'Total Projects',
      value: '24',
      change: '+12%',
      icon: FolderIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Projects',
      value: '8',
      change: '+2%',
      icon: PlayIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Completed Tasks',
      value: '142',
      change: '+24%',
      icon: CheckCircleIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Team Members',
      value: '12',
      change: '+1',
      icon: UserGroupIcon,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
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
