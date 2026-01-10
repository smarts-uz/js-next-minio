"use client";

import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import "@uppy/webcam/css/style.min.css";
import "@uppy/image-editor/css/style.min.css";

import AwsS3 from "@uppy/aws-s3";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import { useMemo } from "react";
import Webcam from "@uppy/webcam";
import ImageEditor from "@uppy/image-editor";
import dynamic from "next/dynamic";

const UppyUploaderComponent = () => {
  // Initialize Uppy instance
  const uppy = useMemo(() => {
    return new Uppy({
      autoProceed: false,
      allowMultipleUploadBatches: false,
      restrictions: {
        maxFileSize: 5 * 1024 * 1024,
        allowedFileTypes: ["image/png", "image/jpeg", "image/jpg"],
        maxNumberOfFiles: 1,
        minNumberOfFiles: 1,
      },
    })
      .use(Webcam, {
        mirror: true,
        modes: ["picture"], // or video if needed
      })
      .use(AwsS3, {
        endpoint: "/api/upload-presigned",
        getUploadParameters: async (file) => {
          const response = await fetch("/api/upload-presigned", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
            }),
          });

          const data = await response.json();
          
          // Store metadata for later use
          file.meta.serverFileName = data.objectName;
          
          return {
            method: data.method,
            url: data.url,
            fields: data.fields,
            headers: data.headers,
          };
        },
      })
      .use(ImageEditor, {
        quality: 0.9,
        cropperOptions: {
          aspectRatio: 1,
          viewMode: 1,
        },
        actions: {
          revert: true,
          rotate: true,
          granularRotate: true,
          flip: true,
          zoomIn: true,
          zoomOut: true,
          cropSquare: true,
        },
      })
      .on("upload-success", async (file, response) => {
        // Save file metadata to database after successful upload
        if (file) {
          try {
            await fetch("/api/upload-presigned", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: file.meta.serverFileName,
                originalName: file.name,
                size: file.size,
                contentType: file.type,
              }),
            });
          } catch (error) {
            console.error("Failed to save file metadata:", error);
          }
        }
      });
  }, []);

  if (!uppy) return null;

  return <Dashboard theme="dark" uppy={uppy} />;
};

const UppyUploader = dynamic(() => Promise.resolve(UppyUploaderComponent), {
  ssr: false,
  loading: () => (
    <p className="h-137 w-187 border border-white rounded flex justify-center items-center bg-black/40 animate-pulse">
      Loading uploader...
    </p>
  ),
});

export default UppyUploader;
