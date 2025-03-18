import { z } from "zod";

export const STORAGE_KEY = "magicapi_screenshot";
export const AGE_DETECTION_STORAGE_KEY = "magicapi_age_detection";

export const screenshotValidator = z.array(
  z.object({
    input: z.string().url(),
    imageData: z.string(),
    createdAt: z.string().datetime(),
  })
);

export type ScreenshotItem = z.infer<typeof screenshotValidator>[number];

export const ageDetectionResultValidator = z.array(
  z.object({
    age: z.string(),
    predictTime: z.number(),
    imageData: z.string(),
    createdAt: z.string().datetime(),
  })
);

export type AgeDetectionHistoryItem = z.infer<
  typeof ageDetectionResultValidator
>[number];

export const saveToStorage = <T extends ScreenshotItem>(
  key: string,
  item: T,
  validator: z.ZodType<T[]>
): T[] => {
  try {
    const existingItems = getFromStorage<T>(key, validator);
    const newItems = [item, ...existingItems];
    localStorage.setItem(key, JSON.stringify(newItems));
    return newItems;
  } catch (error) {
    console.error("Error saving to storage:", error);
    return [item];
  }
};

export const getFromStorage = <T>(
  key: string,
  validator: z.ZodType<T[]>
): T[] => {
  try {
    const storedData = localStorage.getItem(key);
    if (!storedData) return [];

    const parsedData = JSON.parse(storedData);
    const validationResult = validator.safeParse(parsedData);

    if (validationResult.success) {
      return validationResult.data;
    }

    console.warn("Invalid data in storage, resetting", validationResult.error);
    localStorage.removeItem(key);
    return [];
  } catch (error) {
    console.error("Error getting from storage:", error);
    localStorage.removeItem(key);
    return [];
  }
};

export const removeFromStorage = <T>(
  key: string,
  index: number,
  validator: z.ZodType<T[]>
): T[] => {
  try {
    const items = getFromStorage<T>(key, validator);
    const newItems = [...items.slice(0, index), ...items.slice(index + 1)];
    localStorage.setItem(key, JSON.stringify(newItems));
    return newItems;
  } catch (error) {
    console.error("Error removing from storage:", error);
    return getFromStorage<T>(key, validator);
  }
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return blobToBase64(file);
};
