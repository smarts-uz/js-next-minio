"use client";

import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";

import AwsS3 from "@uppy/aws-s3";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import axios from "axios";

const FILE_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const UppyUploaderComponent = () => {
  // Initialize Uppy instance
  const uppy = useMemo(() => {
    return new Uppy({
      autoProceed: false,
      allowMultipleUploadBatches: false,
      restrictions: {
        maxFileSize: MAX_FILE_SIZE,
        allowedFileTypes: FILE_TYPES,
        maxNumberOfFiles: 1,
        minNumberOfFiles: 1,
      },
    })
      .use(AwsS3, {
        endpoint: "/api/upload-presigned",
        getUploadParameters: async (file) => {
          const { data } = await axios.post("/api/upload-presigned", {
            fileName: file.name,
            originalName: file.name,
            size: file.size,
          });

          // Store metadata for later use
          file.meta.serverFileName = data.objectName;
          file.meta.fileId = data.fileId; // Store the database ID

          return {
            method: data.method,
            url: data.url,
            fields: data.fields,
            headers: data.headers,
          };
        },
      })
      .on("upload-success", async (file) => {
        if (file) {
          try {
            await axios.put("/api/upload-presigned", {
              fileId: file.meta.fileId,
              contentType: file.type,
            });
          } catch (error) {
            console.error("Failed to update file status:", error);
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
