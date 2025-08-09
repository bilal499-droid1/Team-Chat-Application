import { useNavigate } from 'react-router-dom';
import { useSearch } from '../../contexts/SearchContext';
import {
  FolderIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const SearchResults = () => {
  const navigate = useNavigate();
  const { searchResults, showResults, setShowResults, clearSearch, isSearching } = useSearch();
  const { projects, tasks, members } = searchResults;

  if (!showResults) return null;

  const hasResults = projects.length > 0 || tasks.length > 0 || members.length > 0;

  const handleProjectClick = (projectId) => {
    navigate(`/projects`);
    clearSearch();
  };

  const handleTaskClick = (task) => {
    navigate(`/projects`);
    clearSearch();
  };

  const handleMemberClick = (member) => {
    navigate(`/projects`);
    clearSearch();
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Search Results</h3>
        <button
          onClick={() => setShowResults(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Loading state */}
      {isSearching && (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Searching...</p>
        </div>
      )}

      {/* No results */}
      {!isSearching && !hasResults && (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">No results found</p>
        </div>
      )}

      {/* Results */}
      {!isSearching && hasResults && (
        <div className="py-2">
          {/* Projects */}
          {projects.length > 0 && (
            <div className="mb-2">
              <h4 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Projects ({projects.length})
              </h4>
              {projects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => handleProjectClick(project._id)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                >
                  <FolderIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {project.name}
                    </p>
                    {project.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {project.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div className="mb-2">
              <h4 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Tasks ({tasks.length})
              </h4>
              {tasks.map((task) => (
                <button
                  key={task._id}
                  onClick={() => handleTaskClick(task)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                >
                  <ClipboardDocumentListIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      in {task.projectName}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    task.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : task.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Members */}
          {members.length > 0 && (
            <div>
              <h4 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Team Members ({members.length})
              </h4>
              {members.map((member) => (
                <button
                  key={member._id}
                  onClick={() => handleMemberClick(member)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                >
                  <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt={member.fullName} 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.fullName || member.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {member.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
