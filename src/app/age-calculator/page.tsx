"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  Upload,
  X,
  AlertTriangle,
  Calendar,
  Loader2,
  Clock,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { API_KEY, API_URL } from "@/lib/constants";
import { uploadImage } from "@/lib/upload";
import Image from "next/image";
import {
  saveToStorage,
  getFromStorage,
  removeFromStorage,
  fileToBase64,
  ageDetectionResultValidator,
  AGE_DETECTION_STORAGE_KEY,
  type AgeDetectionHistoryItem,
} from "@/lib/utils";

type ProcessingState =
  | "idle"
  | "uploading"
  | "processing"
  | "success"
  | "error";

interface AgeDetectionResponse {
  input: { image: string };
  output: string;
  status: string;
  error: string | null;
  metrics: { predict_time: number };
}

interface AgeDetectionResult {
  age: string;
  predictTime: number;
  imageData: string;
}

export default function AgeDetectionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [processingState, setProcessingState] =
    useState<ProcessingState>("idle");
  const [result, setResult] = useState<AgeDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<AgeDetectionHistoryItem[]>(
    getFromStorage<AgeDetectionHistoryItem>(
      AGE_DETECTION_STORAGE_KEY,
      ageDetectionResultValidator
    )
  );
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.[0]) return;

      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      try {
        const base64Data = await fileToBase64(selectedFile);
        setImageData(base64Data);

        setResult(null);
        setError(null);
        setUploadedImageUrl(null);
      } catch (err) {
        setError("Failed to process image");
        console.error(err);
      }
    },
    []
  );

  const resetState = useCallback(() => {
    setFile(null);
    setImageData(null);
    setResult(null);
    setError(null);
    setProcessingState("idle");
    setUploadedImageUrl(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const detectAge = useCallback(
    async (imageUrl: string): Promise<AgeDetectionResult> => {
      const DETECTION_ENDPOINT = `${API_URL}/api/v1/magicapi/age-detector/predictions`;

      const response = await fetch(DETECTION_ENDPOINT, {
        method: "POST",
        headers: {
          "x-magicapi-key": API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          input: { image: imageUrl },
        }),
      });

      if (!response.ok) {
        throw new Error(`Detection failed: ${response.status}`);
      }

      const data = (await response.json()) as AgeDetectionResponse;

      if (data.status !== "succeeded" || data.error) {
        throw new Error(data.error || "Detection failed");
      }

      if (!imageData) {
        throw new Error("Image data is missing");
      }

      return {
        age: data.output,
        predictTime: data.metrics.predict_time,
        imageData,
      };
    },
    [imageData]
  );

  const processImage = useCallback(async () => {
    if (!file || !imageData) return;

    try {
      setError(null);

      let imageUrl = uploadedImageUrl;

      if (!imageUrl) {
        setProcessingState("uploading");
        imageUrl = await uploadImage(file);
        setUploadedImageUrl(imageUrl);
      }

      setProcessingState("processing");
      const detectionResult = await detectAge(imageUrl);

      const historyItem: AgeDetectionHistoryItem = {
        ...detectionResult,
        createdAt: new Date().toISOString(),
      };

      const updatedHistory = saveToStorage(
        AGE_DETECTION_STORAGE_KEY,
        historyItem,
        ageDetectionResultValidator
      );

      setHistory(updatedHistory);
      setResult(detectionResult);
      setProcessingState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setProcessingState("error");
    }
  }, [file, imageData, uploadedImageUrl, detectAge]);

  const deleteHistoryItem = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const updatedHistory = removeFromStorage<AgeDetectionHistoryItem>(
        AGE_DETECTION_STORAGE_KEY,
        index,
        ageDetectionResultValidator
      );
      setHistory(updatedHistory);

      if (expandedIndex === index) {
        setExpandedIndex(null);
      } else if (expandedIndex !== null && expandedIndex > index) {
        setExpandedIndex(expandedIndex - 1);
      }
    },
    [expandedIndex]
  );

  const toggleExpand = useCallback(
    (index: number) => {
      setExpandedIndex(expandedIndex === index ? null : index);
    },
    [expandedIndex]
  );

  const formatDateTime = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, []);

  const downloadResult = useCallback(
    (item: AgeDetectionHistoryItem, e: React.MouseEvent) => {
      e.stopPropagation();
      const a = document.createElement("a");
      a.href = item.imageData;
      a.download = `age-detection-${item.age}yrs-${
        new Date(item.createdAt).toISOString().split("T")[0]
      }.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    []
  );

  const ageDescription = useMemo(() => {
    if (!result?.age) return "";

    const age = parseInt(result.age, 10);
    if (isNaN(age)) return "";

    if (age < 13) return "Child";
    if (age < 20) return "Teenager";
    if (age < 30) return "Young Adult";
    if (age < 50) return "Adult";
    if (age < 65) return "Middle-aged";
    return "Senior";
  }, [result?.age]);

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [history]
  );

  const renderDropzone = () => (
    <div className="flex flex-col items-center">
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer border-gray-600 hover:border-gray-500 bg-gray-800">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-10 h-10 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 5MB)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );

  const renderImagePreview = () => (
    <div className="flex flex-col">
      <div className="relative">
        <Image
          src={imageData || ""}
          alt="Preview"
          className="w-full h-auto rounded-lg object-cover max-h-96"
          width={500}
          height={500}
        />
        <button
          onClick={resetState}
          className="absolute top-2 right-2 p-1 bg-gray-900 rounded-full opacity-70 hover:opacity-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={processImage}
        disabled={
          processingState === "uploading" || processingState === "processing"
        }
        className={`mt-4 p-3 rounded-lg flex items-center justify-center transition-colors ${
          processingState === "uploading" || processingState === "processing"
            ? "bg-gray-700 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {processingState === "uploading" ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Uploading...
          </>
        ) : processingState === "processing" ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          "Detect Age"
        )}
      </button>
    </div>
  );

  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="bg-gray-800 rounded-lg p-6 mt-6">
        <h3 className="text-xl font-bold mb-4">Detection Results</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-blue-400" />
            <div>
              <div className="text-sm text-gray-400">Estimated Age</div>
              <div className="text-xl font-bold">{result.age}</div>
              {ageDescription && (
                <div className="text-sm text-gray-400">{ageDescription}</div>
              )}
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg flex items-center">
            <Clock className="w-6 h-6 mr-3 text-blue-400" />
            <div>
              <div className="text-sm text-gray-400">Processing Time</div>
              <div className="text-xl font-bold">
                {result.predictTime.toFixed(2)}s
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={resetState}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Upload New Image
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold flex items-center">
            <Calendar className="mr-2" />
            AI Age Detection
          </h1>
        </header>

        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
          {!imageData ? renderDropzone() : renderImagePreview()}

          {error && (
            <div className="mt-4 p-4 bg-red-900/30 rounded-lg flex items-start">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-400 mt-0.5" />
              <div className="text-red-300">{error}</div>
            </div>
          )}
        </div>

        {processingState === "success" && renderResult()}

        <div className="text-sm text-gray-400 mb-8">
          <p>
            This tool uses AI to estimate the age of a person from their photo.
            Upload a clear face image for the most accurate results.
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Clock className="mr-2" />
            Detection History
          </h2>

          {sortedHistory.length === 0 ? (
            <div className="mt-8 text-center p-6 bg-gray-800 rounded-lg">
              <p className="text-gray-400">No age detections yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedHistory.map((item, index) => (
                <div
                  key={`${item.createdAt}-${index}`}
                  className="bg-gray-800 rounded-lg overflow-hidden"
                >
                  <div className="p-4 flex items-center justify-between hover:bg-gray-750">
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => toggleExpand(index)}
                    >
                      <div className="w-10 h-10 bg-gray-700 rounded overflow-hidden mr-3 flex-shrink-0">
                        <Image
                          src={item.imageData}
                          alt="Thumbnail"
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{item.age} years old</div>
                        <div className="text-sm text-gray-400 flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDateTime(item.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
                        onClick={(e) => downloadResult(item, e)}
                        aria-label="Download image"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      <button
                        className="p-2 rounded-full hover:bg-red-600 text-gray-400 hover:text-white"
                        onClick={(e) => deleteHistoryItem(index, e)}
                        aria-label="Delete detection"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {expandedIndex === index && (
                    <div className="border-t border-gray-700">
                      <div className="relative h-64 md:h-96 bg-gray-900">
                        <Image
                          src={item.imageData}
                          alt="Detection image"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-750">
                        <div className="bg-gray-700 p-3 rounded flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                          <div>
                            <div className="text-xs text-gray-400">
                              Estimated Age
                            </div>
                            <div className="font-bold">{item.age}</div>
                          </div>
                        </div>
                        <div className="bg-gray-700 p-3 rounded flex items-center">
                          <Clock className="w-5 h-5 mr-2 text-blue-400" />
                          <div>
                            <div className="text-xs text-gray-400">
                              Processing Time
                            </div>
                            <div className="font-bold">
                              {item.predictTime.toFixed(2)}s
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
