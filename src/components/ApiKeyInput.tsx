"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Key, Eye, EyeOff } from "lucide-react";

const API_KEY_STORAGE = "magicapi_key";

interface ApiKeyInputProps {
  onKeyChange: (key: string) => void;
}

export default function ApiKeyInput({ onKeyChange }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE);
    if (storedKey) {
      setApiKey(storedKey);
      onKeyChange(storedKey);
    }
  }, [onKeyChange]);

  const handleKeyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newKey = e.target.value;
      setApiKey(newKey);
      onKeyChange(newKey);
    },
    [onKeyChange]
  );

  const saveKey = useCallback(() => {
    if (!apiKey.trim()) return;

    setIsSaving(true);
    localStorage.setItem(API_KEY_STORAGE, apiKey);

    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  }, [apiKey]);

  const toggleVisibility = useCallback(() => {
    setShowKey((prev) => !prev);
  }, []);

  return (
    <div className="mb-6 bg-gray-800 rounded-lg p-4 shadow-md">
      <div className="flex items-center mb-2">
        <Key className="h-4 w-4 mr-2 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300">API Key</h3>
      </div>

      <div className="relative">
        <input
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={handleKeyChange}
          placeholder="Enter your MagicAPI key"
          className="w-full p-2 pr-20 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <button
            type="button"
            onClick={toggleVisibility}
            className="p-1 rounded-full hover:bg-gray-600 text-gray-400"
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        <button
          onClick={saveKey}
          disabled={!apiKey.trim() || isSaving}
          className={`px-3 py-1 rounded text-xs ${
            apiKey.trim() && !isSaving
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-700 opacity-50 cursor-not-allowed"
          }`}
        >
          {isSaving ? "Saved" : "Save Key"}
        </button>
      </div>
    </div>
  );
}
