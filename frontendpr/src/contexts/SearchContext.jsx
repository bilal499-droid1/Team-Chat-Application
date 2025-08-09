import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    projects: [],
    tasks: [],
    members: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search function
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch(searchQuery);
      } else {
        setSearchResults({ projects: [], tasks: [], members: [] });
        setShowResults(false);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const performSearch = async (query) => {
    if (!query.trim()) return;

    console.log('🔍 Starting search for:', query);
    setIsSearching(true);
    setShowResults(true);

    try {
      // Search projects
      console.log('📁 Fetching projects...');
      const projectsResponse = await api.get('/projects');
      console.log('📁 Projects response:', projectsResponse.data);
      const allProjects = projectsResponse.data?.data?.projects || [];
      const filteredProjects = allProjects.filter(project =>
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.description?.toLowerCase().includes(query.toLowerCase())
      );
      console.log('📁 Filtered projects:', filteredProjects);

      // Search tasks from all projects
      let allTasks = [];
      for (const project of allProjects) {
        try {
          const tasksResponse = await api.get(`/tasks/project/${project._id}`);
          const projectTasks = (tasksResponse.data?.data?.tasks || []).map(task => ({
            ...task,
            projectName: project.name,
            projectId: project._id
          }));
          allTasks = [...allTasks, ...projectTasks];
        } catch (error) {
          // Skip if project tasks can't be fetched
          console.warn(`Could not fetch tasks for project ${project._id}`);
        }
      }

      const filteredTasks = allTasks.filter(task =>
        task.title?.toLowerCase().includes(query.toLowerCase()) ||
        task.description?.toLowerCase().includes(query.toLowerCase())
      );

      // Search members (from project members)
      let allMembers = [];
      for (const project of allProjects) {
        if (project.members && Array.isArray(project.members)) {
          const projectMembers = project.members.map(member => ({
            ...member,
            projectName: project.name,
            projectId: project._id
          }));
          allMembers = [...allMembers, ...projectMembers];
        }
      }

      // Remove duplicates based on user ID
      const uniqueMembers = allMembers.filter((member, index, self) =>
        index === self.findIndex(m => m._id === member._id)
      );

      const filteredMembers = uniqueMembers.filter(member =>
        member.username?.toLowerCase().includes(query.toLowerCase()) ||
        member.fullName?.toLowerCase().includes(query.toLowerCase()) ||
        member.email?.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults({
        projects: filteredProjects.slice(0, 5), // Limit to 5 results
        tasks: filteredTasks.slice(0, 5),
        members: filteredMembers.slice(0, 5)
      });

      console.log('🎯 Final search results:', {
        projects: filteredProjects.slice(0, 5),
        tasks: filteredTasks.slice(0, 5),
        members: filteredMembers.slice(0, 5)
      });

    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults({ projects: [], tasks: [], members: [] });
    }

    setIsSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ projects: [], tasks: [], members: [] });
    setShowResults(false);
  };

  const value = {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    showResults,
    setShowResults,
    clearSearch
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
