"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { File } from "@/generated/prisma/client";
import axios from "axios";

interface FilesGridProps {
  files: File[];
}

export default function FilesGrid({ files }: FilesGridProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [presignedUrls, setPresignedUrls] = useState<Record<string, string>>({});

  // Fetch presigned URLs for private images
  useEffect(() => {
    const fetchPresignedUrls = async () => {
      const privateFiles = files.filter(file => file.exposure === "private");
      
      for (const file of privateFiles) {
        if (file.bucket && file.fileName && !presignedUrls[file.id]) {
          try {
            const { data } = await axios.get("/api/get-presigned", {
              params: {
                bucket: file.bucket,
                object: file.fileName,
              },
            });
            
            setPresignedUrls(prev => ({
              ...prev,
              [file.id]: data.url,
            }));
          } catch (error) {
            console.error(`Failed to fetch presigned URL for ${file.id}:`, error);
          }
        }
      }
    };

    fetchPresignedUrls();
  }, [files, presignedUrls]);

  // Get the appropriate URL for a file
  const getFileUrl = (file: File) => {
    if (file.exposure === "private") {
      return presignedUrls[file.id] || null;
    }
    return file.url;
  };

  if (files.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
        <p className="text-center text-gray-500 dark:text-gray-400">
          No images uploaded yet. Upload your first image above!
        </p>
      </div>
    );
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          Uploaded Images ({files.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedImage(file)}
            >
              <div className="aspect-square relative bg-gray-200 dark:bg-gray-700">
                {getFileUrl(file) && (
                  <Image
                    src={getFileUrl(file)!}
                    alt={file.originalName || "Uploaded image"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized={file.exposure === "private"}
                  />
                )}
                {!getFileUrl(file) && file.exposure === "private" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate mb-1">
                  {file.originalName || "Unknown"}
                </h3>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      file.exposure === "private"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}
                  >
                    {file.exposure === "private" ? "🔒 Private" : "🌐 Public"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatDate(file.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/20 bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6 text-gray-800 dark:text-gray-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="relative w-full" style={{ maxHeight: "70vh" }}>
              {getFileUrl(selectedImage) && (
                <Image
                  src={getFileUrl(selectedImage)!}
                  alt={selectedImage.originalName || "Uploaded image"}
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  style={{ maxHeight: "70vh", objectFit: "contain" }}
                  unoptimized={selectedImage.exposure === "private"}
                />
              )}
              {!getFileUrl(selectedImage) && selectedImage.exposure === "private" && (
                <div className="flex items-center justify-center p-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {selectedImage.originalName}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Size:
                  </span>
                  <span className="ml-2 text-gray-800 dark:text-gray-200">
                    {formatFileSize(selectedImage.size)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Privacy:
                  </span>
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                      selectedImage.exposure === "private"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}
                  >
                    {selectedImage.exposure === "private" ? "🔒 Private" : "🌐 Public"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Uploaded:
                  </span>
                  <span className="ml-2 text-gray-800 dark:text-gray-200">
                    {formatDate(selectedImage.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Bucket:
                  </span>
                  <span className="ml-2 text-gray-800 dark:text-gray-200">
                    {selectedImage.bucket}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 dark:text-gray-400">URL:</span>
                  <a
                    href={getFileUrl(selectedImage) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {selectedImage.exposure === "private" 
                      ? "(Private - Presigned URL)" 
                      : selectedImage.url}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
