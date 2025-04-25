import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FileUpload = ({
  multiple = false,
  maxFiles = 5,
  maxSize = 5, // in MB
  accept = "image/*",
  value = [],
  onChange,
  error,
  helperText,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  // Process selected files
  const processFiles = (files) => {
    // Check if max files limit is reached
    if (multiple && value.length + files.length > maxFiles) {
      alert(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    // Filter files by size and type
    const validFiles = files.filter((file) => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the maximum size of ${maxSize}MB.`);
        return false;
      }

      // Check file type if accept is specified
      if (accept && accept !== "*") {
        const fileType = file.type;
        const acceptedTypes = accept.split(",").map((type) => type.trim());

        // Check if file type matches any of the accepted types
        const isAccepted = acceptedTypes.some((type) => {
          if (type.endsWith("/*")) {
            // Handle wildcards like 'image/*'
            const typePrefix = type.slice(0, -1);
            return fileType.startsWith(typePrefix);
          }
          return type === fileType;
        });

        if (!isAccepted) {
          alert(`File "${file.name}" is not an accepted file type.`);
          return false;
        }
      }

      return true;
    });

    // Create preview URLs for valid files
    const newFiles = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    // Update value
    if (multiple) {
      onChange([...value, ...newFiles]);
    } else {
      onChange(newFiles.length > 0 ? [newFiles[0]] : []);
    }
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // Handle remove file
  const handleRemoveFile = (index) => {
    if (disabled) return;

    const newFiles = [...value];

    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newFiles[index].preview);

    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-2">
      {/* Dropzone */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary bg-opacity-10"
            : error
            ? "border-red-500 bg-red-50"
            : "border-gray-300 hover:border-primary"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center py-4">
          <svg
            className="w-10 h-10 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            ></path>
          </svg>

          <p className="text-sm text-gray-600 mb-1">
            {isDragging
              ? "Drop files here"
              : "Drag and drop files here, or click to select files"}
          </p>

          <p className="text-xs text-gray-500">
            {multiple
              ? `Upload up to ${maxFiles} images (max ${maxSize}MB each)`
              : `Upload an image (max ${maxSize}MB)`}
          </p>
        </div>
      </div>

      {/* Helper text or error message */}
      {(helperText || error) && (
        <p className={`text-xs ${error ? "text-red-500" : "text-gray-500"}`}>
          {error || helperText}
        </p>
      )}

      {/* Preview of uploaded files */}
      {value.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {multiple ? "Uploaded Files" : "Uploaded File"}
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {value.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    transition: { duration: 0.2 },
                  }}
                  className="relative group border rounded-lg overflow-hidden bg-gray-100"
                >
                  {/* Image preview */}
                  <div className="aspect-w-1 aspect-h-1">
                    <img
                      src={
                        file.preview ||
                        (typeof file === "string"
                          ? file.startsWith("http")
                            ? file
                            : file.startsWith("/uploads")
                            ? `${
                                window.location.hostname === "localhost"
                                  ? "http://localhost:5000"
                                  : ""
                              }${file}`
                            : file
                          : file)
                      }
                      alt={file.name || `File ${index + 1}`}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        console.error("Image load error:", e);
                        // Try alternative URL format if the first one fails
                        if (!e.target.dataset.retried) {
                          e.target.dataset.retried = true;

                          // If it's a local path that failed, try with the full production URL
                          if (
                            typeof file === "string" &&
                            file.startsWith("/uploads")
                          ) {
                            const productionUrl = `https://furniture-q3nb.onrender.com${file}`;
                            console.log(
                              "Retrying with production URL:",
                              productionUrl
                            );
                            e.target.src = productionUrl;
                            return;
                          }

                          // If it's a Cloudinary URL that failed, try with a different format
                          if (
                            typeof file === "string" &&
                            file.includes("cloudinary.com")
                          ) {
                            // Try a different transformation or format
                            const cloudinaryUrl = file.replace(
                              "/upload/",
                              "/upload/w_300,h_300,c_fill/"
                            );
                            console.log(
                              "Retrying with transformed Cloudinary URL:",
                              cloudinaryUrl
                            );
                            e.target.src = cloudinaryUrl;
                            return;
                          }
                        }

                        // If all retries fail, show placeholder
                        e.target.src =
                          "https://via.placeholder.com/300x300?text=Image+Error";
                      }}
                    />
                  </div>

                  {/* File info overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="text-white text-xs truncate">
                      {file.name && <p className="truncate">{file.name}</p>}
                      {file.size && <p>{formatFileSize(file.size)}</p>}
                    </div>

                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        className="self-end bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
