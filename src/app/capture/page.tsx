"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Camera,
  Download,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { API_KEY, API_URL } from "@/lib/constants";
import Image from "next/image";

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
  const [url, setUrl] = useState("");
  const [screenshotState, setScreenshotState] =
    useState<ScreenshotState>("idle");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

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
    if (!isValidUrl) return;

    try {
      setScreenshotState("loading");
      setError(null);

      const fullParams: ScreenshotParams = { ...params, url };
      const queryString = generateQueryString(fullParams);

      const response = await fetch(`${API_URL}/api/v1/magicapi/screenshot-api/api/screenshot?${queryString}`, {
        method: "GET",
        headers: {
          accept: `image/${params.outFormat}`,
          "x-magicapi-key": API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      setScreenshotUrl(objectUrl);
      setScreenshotState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setScreenshotState("error");
    }
  }, [isValidUrl, params, url, generateQueryString]);

  const downloadScreenshot = useCallback(() => {
    if (!screenshotUrl) return;

    const a = document.createElement("a");
    a.href = screenshotUrl;
    a.download = `screenshot.${params.outFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [screenshotUrl, params.outFormat]);

  const resetForm = useCallback(() => {
    if (screenshotUrl) {
      URL.revokeObjectURL(screenshotUrl);
    }

    setScreenshotUrl(null);
    setScreenshotState("idle");
    setError(null);
  }, [screenshotUrl]);

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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold flex items-center">
            <Camera className="mr-2" />
            Screenshot Capture Tool
          </h1>
        </header>

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
                disabled={!isValidUrl}
                className={`w-full p-3 rounded-lg flex items-center justify-center ${
                  isValidUrl
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
                {screenshotUrl && (
                  <Image
                    src={screenshotUrl}
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

        <div className="text-sm text-gray-400">
          <p>
            This tool uses the Screenshot API to capture images of websites.
          </p>
          <p>Enter a valid URL and customize capture settings if needed.</p>
        </div>
      </div>
    </div>
  );
}
