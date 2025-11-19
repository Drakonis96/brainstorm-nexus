import { GroupedResult } from "../types";

// Backend API URL - adjust based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const generateAppTheme = async (): Promise<{ title: string, backgroundUrl: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-theme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to generate theme: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating theme:', error);
    throw error;
  }
};

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateImageForCategory = async (category: string, retries = 2): Promise<string | undefined> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`  Retry ${attempt}/${retries} for category: ${category}`);
        await delay(2000 * attempt); // Increasing delay for retries
      }
      
      const response = await fetch(`${API_BASE_URL}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`  Failed to generate image for category ${category}. Status: ${response.status}, Error: ${errorText}`);
        if (attempt < retries) continue; // Try again
        return undefined;
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        console.log(`  ✓ Image URL received for ${category} (${data.imageUrl.substring(0, 50)}...)`);
        return data.imageUrl;
      } else {
        console.warn(`  ✗ No imageUrl in response for ${category}`);
        if (attempt < retries) continue; // Try again
        return undefined;
      }
    } catch (error) {
      console.error(`  Error generating image for category ${category} (attempt ${attempt + 1}):`, error);
      if (attempt < retries) continue; // Try again
      return undefined;
    }
  }
  return undefined;
};

export const groupWordsWithGemini = async (words: string[], groupCount: number): Promise<GroupedResult[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/group-words`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words, groupCount }),
    });

    if (!response.ok) {
      throw new Error(`Failed to group words: ${response.statusText}`);
    }

    const data = await response.json();
    const groups = data.groups;

    console.log('Groups received from backend:', groups);
    console.log('Starting image generation for', groups.length, 'groups');

    // Generate images SEQUENTIALLY to avoid rate limits and ensure completion
    const groupsWithImages: GroupedResult[] = [];
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      console.log(`[${i+1}/${groups.length}] Generating image for category: ${group.category}`);
      
      const imageUrl = await generateImageForCategory(group.category);
      
      if (imageUrl) {
        console.log(`[${i+1}/${groups.length}] ✓ Image generated successfully for ${group.category}`);
      } else {
        console.warn(`[${i+1}/${groups.length}] ✗ Failed to generate image for ${group.category}`);
      }
      
      groupsWithImages.push({ ...group, imageUrl });
      
      // Wait between requests to avoid rate limiting
      if (i < groups.length - 1) {
        await delay(1000); // 1 second between each request
      }
    }

    console.log('All images processed. Groups with images:', groupsWithImages);
    return groupsWithImages;

  } catch (error) {
    console.error("Error interacting with backend:", error);
    throw error;
  }
};