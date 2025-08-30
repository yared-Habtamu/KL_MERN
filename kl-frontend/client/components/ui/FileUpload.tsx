import React, { useRef, useState } from "react";
import { Upload, X, FileText, Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = "image/*,.pdf",
  maxSizeMB = 5,
  className,
  disabled = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          dragActive && !disabled
            ? "border-kiya-teal bg-kiya-teal/5"
            : selectedFile
              ? "border-kiya-green bg-kiya-green/5"
              : error
                ? "border-kiya-red bg-kiya-red/5"
                : "border-gray-600 hover:border-kiya-teal hover:bg-kiya-teal/5",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-kiya-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check size={24} className="text-kiya-green" />
            </div>
            <p className="text-kiya-text font-medium mb-1">File Selected</p>
            <p className="text-sm text-kiya-text-secondary">
              {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 bg-kiya-teal/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload size={24} className="text-kiya-teal" />
            </div>
            <p className="text-kiya-text font-medium mb-1">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-kiya-text-secondary">
              Supports images and PDF files up to {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      {selectedFile && (
        <div className="bg-kiya-surface rounded-lg p-4 border border-gray-700">
          <div className="flex items-start space-x-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-kiya-dark rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={24} className="text-kiya-text-secondary" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-kiya-text font-medium truncate">
                {selectedFile.name}
              </p>
              <p className="text-sm text-kiya-text-secondary">
                {formatFileSize(selectedFile.size)}
              </p>
              <p className="text-xs text-kiya-text-secondary">
                {selectedFile.type || "Unknown type"}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="p-1 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0"
            >
              <X size={16} className="text-kiya-text-secondary" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-kiya-red/10 border border-kiya-red/20 rounded-lg p-3">
          <p className="text-kiya-red text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
