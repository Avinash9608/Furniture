import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUpload = ({
  multiple = false,
  maxFiles = 5,
  maxSize = 5, // in MB
  accept = 'image/*',
  value = [],
  onChange,
  error,
  helperText,
  className = ''
}) => {
  const onDrop = useCallback((acceptedFiles) => {
    // Create preview URLs for accepted files
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));

    // If not multiple, replace existing files
    if (!multiple) {
      onChange(newFiles);
    } else {
      // Add new files to existing ones, respecting maxFiles limit
      const currentFiles = Array.isArray(value) ? value : [];
      const combinedFiles = [...currentFiles, ...newFiles].slice(0, maxFiles);
      onChange(combinedFiles);
    }
  }, [multiple, maxFiles, onChange, value]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple,
    maxFiles,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-600'}
          ${error ? 'border-red-500' : ''}
          hover:border-primary dark:hover:border-primary`}
      >
        <input {...getInputProps()} />
        <div className="space-y-1 text-gray-600 dark:text-gray-300">
          <p className="text-sm">
            {isDragActive ? (
              "Drop the files here..."
            ) : (
              <>
                Drag & drop files here, or <span className="text-primary">browse</span>
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {helperText || `Upload up to ${maxFiles} files (${maxSize}MB max each)`}
          </p>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
