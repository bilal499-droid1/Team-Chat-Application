import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { projectAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/common/Toast';
import { 
  PlusIcon, 
  FolderIcon, 
  UserGroupIcon, 
  CalendarIcon,
  ChevronRightIcon,
  CogIcon,
  TrashIcon,
  UserPlusIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

const Projects = () => {
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getProjects();
      setProjects(response.data.data.projects);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching projects:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view projects.');
      } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setError('Network error. Please check if the backend server is running.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch projects. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.planning;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  const getRoleBadge = (role) => {
    const badges = {
      owner: { icon: '🔑', color: 'bg-yellow-100 text-yellow-800', label: 'Owner' },
      admin: { icon: '⚙️', color: 'bg-blue-100 text-blue-800', label: 'Admin' },
      member: { icon: '👤', color: 'bg-green-100 text-green-800', label: 'Member' }
    };
    return badges[role] || badges.member;
  };

  const getUserRole = (project) => {
    if (!user || !user._id) {
      return 'member';
    }
    
    if (!project.members || project.members.length === 0) {
      return 'member';
    }

    const member = project.members.find(m => {
      if (!m.user || !m.user._id) {
        return false;
      }
      
      // Handle both string and object comparison
      const memberId = typeof m.user._id === 'string' ? m.user._id : m.user._id.toString();
      const userId = typeof user._id === 'string' ? user._id : user._id.toString();
      
      return memberId === userId;
    });
    
    return member?.role || 'member';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const openProjectDetails = (project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ToastContainer />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600">Manage your team projects and collaborations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Project
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first project</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const userRole = getUserRole(project);
              const roleBadge = getRoleBadge(userRole);
              
              return (
                <div
                  key={project._id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openProjectDetails(project)}
                >
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                        {project.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}>
                        {roleBadge.icon} {roleBadge.label}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Project Description */}
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Project Stats */}
                  <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {project.members?.length || 0}
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(project.createdAt)}
                    </div>
                  </div>

                  {/* Status and Priority */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                      {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                    </span>
                  </div>

                  {/* Project Color Indicator */}
                  <div 
                    className="h-1 w-full mt-4 rounded-full"
                    style={{ backgroundColor: project.color }}
                  ></div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <CreateProjectModal 
            onClose={() => setShowCreateModal(false)}
            onSuccess={(message) => {
              fetchProjects();
              showToast(message || 'Project created successfully!', 'success');
            }}
            showToast={showToast}
          />
        )}

        {/* Project Details Modal */}
        {showProjectModal && selectedProject && (
          <ProjectDetailsModal
            project={selectedProject}
            onClose={() => {
              setShowProjectModal(false);
              setSelectedProject(null);
            }}
            onUpdate={fetchProjects}
          />
        )}
      </div>
    </Layout>
  );
};

// Create Project Modal Component
const CreateProjectModal = ({ onClose, onSuccess, showToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    color: '#3B82F6',
    isPrivate: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await projectAPI.createProject(formData);
      onSuccess(response.data.message);
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create project';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Project description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700">
              Private project (no invite code)
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Project Details Modal Component
const ProjectDetailsModal = ({ project, onClose, onUpdate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const getUserRole = (project) => {
    if (!user || !user._id) {
      return 'member';
    }
    
    if (!project.members || project.members.length === 0) {
      return 'member';
    }

    const member = project.members.find(m => {
      if (!m.user || !m.user._id) {
        return false;
      }
      
      // Handle both string and object comparison
      const memberId = typeof m.user._id === 'string' ? m.user._id : m.user._id.toString();
      const userId = typeof user._id === 'string' ? user._id : user._id.toString();
      
      return memberId === userId;
    });
    
    return member?.role || 'member';
  };

  const userRole = getUserRole(project);
  const canInvite = ['owner', 'admin', 'member'].includes(userRole); // All roles can invite
  const canDelete = userRole === 'owner' || userRole === 'admin'; // Only owners and admins can delete

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    try {
      const response = await projectAPI.inviteToProject(project._id, inviteEmail, inviteRole);
      showToast(`Successfully invited ${inviteEmail} as ${inviteRole}!`, 'success');
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteForm(false);
      onUpdate(); // Refresh project data
    } catch (err) {
      console.error('Invitation error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send invitation';
      showToast(errorMessage, 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDelete = async () => {
    // Double-check permissions before deleting
    const currentUserRole = getUserRole(project);
    
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') {
      showToast('Access denied. Only project owners and admins can delete projects.', 'error');
      return;
    }

    setDeleteLoading(true);
    try {
      await projectAPI.deleteProject(project._id);
      showToast(`Project "${project.name}" deleted successfully!`, 'success');
      onUpdate(); // Refresh project list
      onClose(); // Close modal
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete project';
      showToast(errorMessage, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{project.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Project Info */}
          <div>
            <h3 className="text-lg font-medium mb-3">Project Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {project.description && (
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="text-gray-600 mt-1">{project.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 capitalize">{project.status}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Priority:</span>
                  <span className="ml-2 capitalize">{project.priority}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2">{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Members:</span>
                  <span className="ml-2">{project.members?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invite Section */}
          {canInvite && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">Invite Member</h3>
                {!showInviteForm && (
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-1" />
                    Invite
                  </button>
                )}
              </div>

              {showInviteForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <form onSubmit={handleInvite} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter registered user's email"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        User must already have an account
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="member">👤 Member</option>
                        <option value="admin">⚙️ Admin</option>
                        <option value="owner">🔑 Owner</option>
                      </select>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowInviteForm(false);
                          setInviteEmail('');
                          setInviteRole('member');
                        }}
                        className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={inviteLoading || !inviteEmail.trim()}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {inviteLoading ? 'Inviting...' : 'Send Invite'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          <div>
            <h3 className="text-lg font-medium mb-3">Team Members</h3>
            <div className="space-y-2">
              {project.members?.map((member) => (
                <div key={member.user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {member.user.fullName?.charAt(0) || member.user.username?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user.fullName || member.user.username}
                      </p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.role === 'owner' ? 'bg-yellow-100 text-yellow-800' :
                    member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {member.role === 'owner' ? '🔑' : member.role === 'admin' ? '⚙️' : '👤'} {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center space-x-3 mt-6 pt-6 border-t">
          <div>
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <TrashIcon className="h-4 w-4 inline mr-2" />
                Delete Project
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Project
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete "<span className="font-medium">{project.name}</span>"? 
                  This action cannot be undone and will remove all project data including tasks and member associations.
                </p>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete Project'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
