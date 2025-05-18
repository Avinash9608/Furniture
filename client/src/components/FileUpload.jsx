import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { getAssetUrl } from "../utils/apiUrlHelper";
import { getImageUrl } from "../utils/imageHelper";

const FileUpload = ({
  multiple = false,
  maxFiles = 5,
  maxSize = 5, // in MB
  accept = "image/*",
  value = [],
  onChange,
  error,
  helperText,
  className = "",
}) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      // Validate file types
      const validFiles = acceptedFiles.filter((file) => {
        const isValidType = file.type.startsWith("image/");
        if (!isValidType) {
          console.warn(`Invalid file type: ${file.type}`);
        }
        return isValidType;
      });

      if (validFiles.length === 0) {
        console.warn("No valid image files were selected");
        return;
      }

      // Process the files directly without creating wrapper objects
      const newFiles = validFiles.map((file) => {
        // Add preview URL to the file object for display
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        });
        return file;
      });

      console.log("New files with previews:", newFiles);

      // If not multiple, replace existing files
      if (!multiple) {
        onChange([newFiles[0]]);
      } else {
        // Add new files to existing ones, respecting maxFiles limit
        const currentFiles = Array.isArray(value) ? value : [];

        // Filter out any non-File objects from currentFiles to avoid mixing types
        const existingFileObjects = currentFiles.filter(
          (file) => file instanceof File
        );
        const existingUrlStrings = currentFiles.filter(
          (file) => typeof file === "string"
        );

        console.log("Existing file objects:", existingFileObjects.length);
        console.log("Existing URL strings:", existingUrlStrings.length);

        // Combine everything, respecting maxFiles limit
        const combinedFiles = [
          ...existingUrlStrings,
          ...existingFileObjects,
          ...newFiles,
        ].slice(0, maxFiles);
        console.log("Combined files:", combinedFiles.length);

        onChange(combinedFiles);
      }
    },
    [multiple, maxFiles, onChange, value]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple,
    maxFiles,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    validator: (file) => {
      if (!file.type.startsWith("image/")) {
        return {
          code: "file-invalid-type",
          message: "Please upload only image files",
        };
      }
      return null;
    },
  });

  // Render preview of selected files
  const renderPreviews = () => {
    if (!value || value.length === 0) return null;

    return (
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {value.map((file, index) => (
          <div key={index} className="relative group">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
              <img
                src={
                  // Handle different types of files/images
                  file instanceof File
                    ? file.preview // Use preview URL for File objects
                    : typeof file === "string"
                    ? getImageUrl(file) // Use the string URL with proper domain
                    : file.preview || getAssetUrl(file) // Fallback for other object types
                }
                alt={`Preview ${index + 1}`}
                className="object-cover object-center w-full h-full"
                onError={(e) => {
                  console.log("Image load error:", e.target.src);
                  // If preview fails, try using a fallback
                  e.target.src =
                    "https://placehold.co/300x300/gray/white?text=Image+Error";
                }}
                onLoad={() => console.log("Image loaded successfully:", index)}
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const newFiles = [...value];
                newFiles.splice(index, 1);
                onChange(newFiles);
              }}
              className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-gray-300 dark:border-gray-600"
          }
          ${error ? "border-red-500" : ""}
          hover:border-primary dark:hover:border-primary`}
      >
        <input {...getInputProps()} />
        <div className="space-y-1 text-gray-600 dark:text-gray-300">
          <p className="text-sm">
            {isDragActive ? (
              "Drop the files here..."
            ) : (
              <>
                Drag & drop files here, or{" "}
                <span className="text-primary">browse</span>
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {helperText ||
              `Upload up to ${maxFiles} ${
                multiple ? "files" : "file"
              } (${maxSize}MB max each)`}
          </p>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {renderPreviews()}
    </div>
  );
};

export default FileUpload;
