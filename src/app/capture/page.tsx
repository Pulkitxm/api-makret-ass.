"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Camera,
  Download,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
} from "lucide-react";
import { API_URL } from "@/lib/constants";
import Image from "next/image";
import {
  saveToStorage,
  getFromStorage,
  removeFromStorage,
  screenshotValidator,
  blobToBase64,
  STORAGE_KEY,
  type ScreenshotItem,
} from "@/lib/utils";
import ApiKeyInput from "@/components/ApiKeyInput";

type ImageFormat = "jpg" | "png" | "webp";
type ScreenshotState = "idle" | "loading" | "success" | "error";

interface ScreenshotParams {
  resX: number;
  resY: number;
  outFormat: ImageFormat;
  waitTime: number;
  isFullPage: boolean;
  dismissModals: boolean;
  url: string;
}

export default function ScreenshotCapture() {
  const [apiKey, setApiKey] = useState<string>("");
  const [url, setUrl] = useState("");
  const [screenshotState, setScreenshotState] = useState<ScreenshotState>("idle");
  const [currentImageData, setCurrentImageData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [items, setItems] = useState<ScreenshotItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    setItems(getFromStorage<ScreenshotItem>(STORAGE_KEY, screenshotValidator));
  }, []);

  const [params, setParams] = useState<Omit<ScreenshotParams, "url">>({
    resX: 1280,
    resY: 900,
    outFormat: "jpg",
    waitTime: 1000,
    isFullPage: false,
    dismissModals: false,
  });

  const updateParam = useCallback(
    <K extends keyof typeof params>(key: K, value: (typeof params)[K]) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const isValidUrl = useMemo(() => {
    try {
      return url.trim() !== "" && Boolean(new URL(url));
    } catch {
      return false;
    }
  }, [url]);

  const generateQueryString = useCallback(
    (params: ScreenshotParams): string => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      return searchParams.toString();
    },
    []
  );

  const captureScreenshot = useCallback(async () => {
    if (!isValidUrl || !apiKey.trim()) return;

    try {
      setScreenshotState("loading");
      setError(null);

      const fullParams: ScreenshotParams = { ...params, url };
      const queryString = generateQueryString(fullParams);

      const response = await fetch(
        `${API_URL}/api/v1/magicapi/screenshot-api/api/screenshot?${queryString}`,
        {
          method: "GET",
          headers: {
            accept: `image/${params.outFormat}`,
            "x-magicapi-key": apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const imageData = await blobToBase64(blob);

      const newItem: ScreenshotItem = {
        input: url,
        imageData,
        createdAt: new Date().toISOString(),
      };

      const updatedItems = saveToStorage(
        STORAGE_KEY,
        newItem,
        screenshotValidator
      );

      setItems(updatedItems);
      setCurrentImageData(imageData);
      setScreenshotState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setScreenshotState("error");
    }
  }, [isValidUrl, params, url, generateQueryString, apiKey]);

  const downloadScreenshot = useCallback(() => {
    if (!currentImageData) return;

    const a = document.createElement("a");
    a.href = currentImageData;

    let filename = "screenshot";
    try {
      const urlObj = new URL(url);
      filename = urlObj.hostname.replace(/\./g, "-");
    } catch {}

    a.download = `${filename}.${params.outFormat}`;
    a.click();
  }, [currentImageData, params.outFormat, url]);

  const deleteScreenshot = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedItems = removeFromStorage<ScreenshotItem>(
      STORAGE_KEY,
      index,
      screenshotValidator
    );
    setItems(updatedItems);
    
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  }, [expandedIndex]);

  const resetForm = useCallback(() => {
    setCurrentImageData(null);
    setScreenshotState("idle");
    setError(null);
  }, []);

  const toggleExpand = useCallback((index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  }, [expandedIndex]);

  const renderAdvancedSettings = () => (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Resolution Width
          </label>
          <input
            type="number"
            value={params.resX}
            onChange={(e) => updateParam("resX", Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Resolution Height
          </label>
          <input
            type="number"
            value={params.resY}
            onChange={(e) => updateParam("resY", Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Format
          </label>
          <select
            value={params.outFormat}
            onChange={(e) =>
              updateParam("outFormat", e.target.value as ImageFormat)
            }
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          >
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Wait Time (ms)
          </label>
          <input
            type="number"
            value={params.waitTime}
            onChange={(e) => updateParam("waitTime", Number(e.target.value))}
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isFullPage"
            checked={params.isFullPage}
            onChange={(e) => updateParam("isFullPage", e.target.checked)}
            className="mr-2 h-4 w-4 rounded bg-gray-700 border-gray-600"
          />
          <label
            htmlFor="isFullPage"
            className="text-sm font-medium text-gray-300"
          >
            Capture Full Page
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="dismissModals"
            checked={params.dismissModals}
            onChange={(e) => updateParam("dismissModals", e.target.checked)}
            className="mr-2 h-4 w-4 rounded bg-gray-700 border-gray-600"
          />
          <label
            htmlFor="dismissModals"
            className="text-sm font-medium text-gray-300"
          >
            Dismiss Modals
          </label>
        </div>
      </div>
    </div>
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

  const formatUrl = useCallback((url: string): string => {
    try {
      const parsedUrl = new URL(url);
      return `${parsedUrl.hostname}${
        parsedUrl.pathname.length > 1 ? "..." : ""
      }`;
    } catch {
      return url.length > 30 ? `${url.substring(0, 30)}...` : url;
    }
  }, []);

  const downloadHistoryScreenshot = useCallback((item: ScreenshotItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = item.imageData;

    let filename = "screenshot";
    try {
      const urlObj = new URL(item.input);
      filename = urlObj.hostname.replace(/\./g, "-");
    } catch {}

    a.download = `${filename}-${
      new Date(item.createdAt).toISOString().split("T")[0]
    }.jpg`;
    a.click();
  }, []);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [items]
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold flex items-center">
            <Camera className="mr-2" />
            Screenshot Capture Tool
          </h1>
        </header>

        <ApiKeyInput onKeyChange={setApiKey} />

        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
          {screenshotState === "idle" ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <button
                  className="flex items-center justify-between w-full p-2 text-gray-300 hover:text-white"
                  onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
                >
                  <div className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Advanced Settings</span>
                  </div>
                  {advancedSettingsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {advancedSettingsOpen && renderAdvancedSettings()}
              </div>

              <button
                onClick={captureScreenshot}
                disabled={!isValidUrl || !apiKey.trim()}
                className={`w-full p-3 rounded-lg flex items-center justify-center ${
                  isValidUrl && apiKey.trim()
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 opacity-50 cursor-not-allowed"
                } transition-colors`}
              >
                <Camera className="mr-2" />
                Capture Screenshot
              </button>
            </>
          ) : screenshotState === "loading" ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p>Capturing screenshot...</p>
            </div>
          ) : screenshotState === "success" ? (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Screenshot Preview</h3>
                <button
                  onClick={resetForm}
                  className="p-1 rounded-full hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-gray-700 rounded-lg overflow-hidden mb-4">
                {currentImageData && (
                  <Image
                    src={currentImageData}
                    alt="Captured screenshot"
                    className="w-full object-contain"
                    width={params.resX}
                    height={params.resY}
                    loading="lazy"
                  />
                )}
              </div>

              <button
                onClick={downloadScreenshot}
                className="w-full p-3 rounded-lg bg-green-600 hover:bg-green-700 flex items-center justify-center"
              >
                <Download className="mr-2" />
                Download Screenshot
              </button>
            </div>
          ) : (
            <div className="bg-red-900/30 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-medium mb-2">Error</h3>
              <p className="text-red-300">{error}</p>
              <button
                onClick={resetForm}
                className="mt-4 p-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-400 mb-8">
          <p>
            This tool uses the Screenshot API to capture images of websites.
            Enter a valid URL and customize capture settings if needed.
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Clock className="mr-2" />
            Screenshot History
          </h2>

          {sortedItems.length === 0 ? (
            <div className="text-center p-6 bg-gray-800 rounded-lg">
              <p className="text-gray-400">No screenshots captured yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedItems.map((item, index) => (
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
                        <div className="font-medium">{formatUrl(item.input)}</div>
                        <div className="text-sm text-gray-400 flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDateTime(item.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
                        onClick={(e) => downloadHistoryScreenshot(item, e)}
                        aria-label="Download screenshot"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      <a
                        href={item.input}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Visit original website"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>

                      <button
                        className="p-2 rounded-full hover:bg-red-600 text-gray-400 hover:text-white"
                        onClick={(e) => deleteScreenshot(index, e)}
                        aria-label="Delete screenshot"
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
                          alt="Captured screenshot"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="p-3 bg-gray-750 text-sm">
                        <a
                          href={item.input}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline break-words"
                        >
                          {item.input}
                        </a>
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