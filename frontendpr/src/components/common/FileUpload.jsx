import { useState, useRef } from 'react';
import { 
  PhotoIcon, 
  DocumentIcon, 
  XMarkIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';

const FileUpload = ({ onFileSelect, onClose, maxSize = 10 * 1024 * 1024 }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const allowedTypes = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
  };

  const allAllowedTypes = [...allowedTypes.images, ...allowedTypes.documents];

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => {
      if (!allAllowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (selectedFiles.length > 0) {
      onFileSelect(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (allowedTypes.images.includes(fileType)) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    }
    return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  };

  const isImage = (fileType) => allowedTypes.images.includes(fileType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Files</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <PaperClipIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to upload
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Supports images (JPEG, PNG, GIF, WebP) and documents (PDF, Word, Excel, TXT, CSV)
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Maximum file size: {maxSize / (1024 * 1024)}MB
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Select Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleInputChange}
            accept={allAllowedTypes.join(',')}
            className="hidden"
          />
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Selected Files ({selectedFiles.length})
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {isImage(file.type) ? (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                        />
                      </div>
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={selectedFiles.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send Files ({selectedFiles.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
