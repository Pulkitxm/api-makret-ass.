"use client";

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Upload, X, AlertTriangle, Calendar, Loader2, Clock } from 'lucide-react';
import { API_KEY, API_URL } from '@/lib/constants';
import { uploadImage } from '@/lib/upload';

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

interface AgeDetectionResponse {
  input: {
    image: string;
  };
  output: string;
  status: string;
  error: string | null;
  metrics: {
    predict_time: number;
  };
}

interface AgeDetectionResult {
  age: string;
  predictTime: number;
  imageUrl: string;
}

export default function AgeDetectionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [result, setResult] = useState<AgeDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    
    setResult(null);
    setError(null);
    setUploadedImageUrl(null);
  }, []);
  
  const resetState = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setProcessingState('idle');
    setUploadedImageUrl(null);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);
  
  const detectAge = useCallback(async (imageUrl: string): Promise<AgeDetectionResult> => {
    const DETECTION_ENDPOINT = `${API_URL}/api/v1/magicapi/age-detector/predictions`;
    
    const response = await fetch(DETECTION_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-magicapi-key': API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        input: { image: imageUrl }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Detection failed: ${response.status}`);
    }
    
    const data = await response.json() as AgeDetectionResponse;
    
    if (data.status !== 'succeeded' || data.error) {
      throw new Error(data.error || 'Detection failed');
    }
    
    return {
      age: data.output,
      predictTime: data.metrics.predict_time,
      imageUrl
    };
  }, []);
  
  const processImage = useCallback(async () => {
    if (!file) return;
    
    try {
      setError(null);
      
      let imageUrl = uploadedImageUrl;
      
      if (!imageUrl) {
        setProcessingState('uploading');
        imageUrl = await uploadImage(file);
        setUploadedImageUrl(imageUrl);
      }
      
      setProcessingState('processing');
      const detectionResult = await detectAge(imageUrl);
      
      setResult(detectionResult);
      setProcessingState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setProcessingState('error');
    }
  }, [file, uploadedImageUrl, detectAge]);
  
  const ageDescription = useMemo(() => {
    if (!result?.age) return '';
    
    const age = parseInt(result.age, 10);
    if (isNaN(age)) return '';
    
    if (age < 13) return 'Child';
    if (age < 20) return 'Teenager';
    if (age < 30) return 'Young Adult';
    if (age < 50) return 'Adult';
    if (age < 65) return 'Middle-aged';
    return 'Senior';
  }, [result?.age]);
  
  const renderDropzone = () => (
    <div className="flex flex-col items-center">
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer border-gray-600 hover:border-gray-500 bg-gray-800">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-10 h-10 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
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
        <img 
          src={previewUrl || ''} 
          alt="Preview" 
          className="w-full h-auto rounded-lg object-cover max-h-96"
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
        disabled={processingState === 'uploading' || processingState === 'processing'}
        className={`mt-4 p-3 rounded-lg flex items-center justify-center transition-colors ${
          processingState === 'uploading' || processingState === 'processing'
            ? 'bg-gray-700 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {processingState === 'uploading' ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Uploading...
          </>
        ) : processingState === 'processing' ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          'Detect Age'
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
              <div className="text-xl font-bold">{result.predictTime.toFixed(2)}s</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={processImage}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Run Again
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">AI Age Detection</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
          {!previewUrl ? renderDropzone() : renderImagePreview()}
          
          {error && (
            <div className="mt-4 p-4 bg-red-900/30 rounded-lg flex items-start">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-400 mt-0.5" />
              <div className="text-red-300">{error}</div>
            </div>
          )}
        </div>
        
        {processingState === 'success' && renderResult()}
        
        <div className="text-center text-sm text-gray-400 mt-4">
          <p>Upload a clear face image for the most accurate results.</p>
        </div>
      </div>
    </div>
  );
}