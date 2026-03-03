import { GoogleGenAI } from "@google/genai";

// Helper to get AI client with latest key
const getAiClient = () => {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    (typeof process !== 'undefined'
      ? process.env?.API_KEY || process.env?.GEMINI_API_KEY
      : undefined);

  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY in your environment.');
  }

  return new GoogleGenAI({ apiKey });
};

export async function generateImage(prompt: string, aspectRatio: string = "1:1", baseImage?: string, styleImage?: string): Promise<string | null> {
  try {
    const ai = getAiClient();
    const parts: any[] = [];
    
    if (baseImage) {
      // Extract base64 data and mime type
      const match = baseImage.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        parts.push({ text: "Use this image as a content reference:" });
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    if (styleImage) {
      const match = styleImage.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        parts.push({ text: "Strictly follow the artistic style, color palette, and visual texture of this reference image. Do not copy the content, only the style:" });
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }
    
    parts.push({ text: prompt });

    // Use gemini-2.5-flash-image for standard generation (no paid key required)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          // imageSize is not supported in 2.5-flash-image, so we remove it
        }
      }
    });

    // Iterate through parts to find the image
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${base64EncodeString}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

export async function improvePrompt(prompt: string): Promise<string> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: `Improve this image generation prompt to be more descriptive, artistic, and detailed. Keep it under 300 characters. Return ONLY the improved prompt text, no explanations or quotes.\n\nOriginal prompt: "${prompt}"`,
    });

    return response.text?.trim() || prompt;
  } catch (error) {
    console.error("Error improving prompt:", error);
    return prompt;
  }
}

export interface FaceSwapOptions {
  fidelity?: 'standard' | 'high' | 'artistic';
  maskingMode?: 'full' | 'internal' | 'eyes' | 'mouth';
  eyeColor?: string;
  hairColor?: string;
  skinTone?: string;
  expression?: string;
  styleImage?: string;
}

export async function swapFace(targetImage: string, sourceFace: string, options: FaceSwapOptions = {}): Promise<string | null> {
  try {
    const ai = getAiClient();
    const parts: any[] = [];
    
    // Target Image
    const targetMatch = targetImage.match(/^data:(.+);base64,(.+)$/);
    if (targetMatch) {
      parts.push({ text: "TARGET IMAGE (Base for pose, lighting, hair, background):" });
      parts.push({
        inlineData: {
          mimeType: targetMatch[1],
          data: targetMatch[2],
        },
      });
    }

    // Source Face
    const sourceMatch = sourceFace.match(/^data:(.+);base64,(.+)$/);
    if (sourceMatch) {
      parts.push({ text: "SOURCE IDENTITY (Face to transfer):" });
      parts.push({
        inlineData: {
          mimeType: sourceMatch[1],
          data: sourceMatch[2],
        },
      });
    }

    // Style Image
    if (options.styleImage) {
      const styleMatch = options.styleImage.match(/^data:(.+);base64,(.+)$/);
      if (styleMatch) {
        parts.push({ text: "STYLE REFERENCE (Apply this art style to the result):" });
        parts.push({
          inlineData: {
            mimeType: styleMatch[1],
            data: styleMatch[2],
          },
        });
      }
    }
    
    // Enhanced prompt for professional "Roop-like" results
    let prompt = `Perform a professional, photorealistic face swap. 
    
TASK: Transfer the facial identity from the SOURCE IDENTITY image onto the TARGET IMAGE.

CRITICAL RULES:
1. PRESERVE the Target Image's exact lighting, shadows, and color grading (unless Style Reference is provided).
2. KEEP the Target Image's background 100% unchanged (unless Style Reference is provided).
3. MATCH the Target Image's facial expression (smile, gaze, emotion) exactly, unless a specific expression is requested.
4. BLEND the new face seamlessly. No visible seams, color mismatches, or blurriness at the edges.
5. The result must look like a raw photograph, not a digital edit (unless Style Reference is provided).`;

    // Apply masking instructions
    if (options.maskingMode) {
      prompt += `\n\nMASKING INSTRUCTIONS (Strictly adhere to this region):`;
      switch (options.maskingMode) {
        case 'internal':
          prompt += `\n- SWAP ONLY INTERNAL FEATURES (Eyes, Nose, Mouth). PRESERVE the Target's jawline, chin, forehead, and hair completely.`;
          break;
        case 'eyes':
          prompt += `\n- SWAP ONLY THE EYES. Keep the Target's nose, mouth, jaw, and all other features exactly as they are.`;
          break;
        case 'mouth':
          prompt += `\n- SWAP ONLY THE MOUTH/LIPS. Keep the Target's eyes, nose, and other features exactly as they are.`;
          break;
        case 'full':
        default:
          prompt += `\n- SWAP THE FULL FACE (including jawline and forehead), but blend naturally into the Target's hair and neck.`;
          break;
      }
    } else {
      prompt += `\n- SWAP THE FULL FACE (Standard behavior).`;
    }

    // Apply custom facial features if provided
    if (options.eyeColor || options.hairColor || options.skinTone || options.expression) {
      prompt += `\n\nCUSTOMIZATION REQUESTS (Apply these specific features to the swapped face):`;
      if (options.eyeColor) prompt += `\n- Change eye color to ${options.eyeColor}.`;
      if (options.hairColor) prompt += `\n- Change hair color to ${options.hairColor}.`;
      if (options.skinTone) prompt += `\n- Change skin tone to ${options.skinTone}.`;
      if (options.expression) prompt += `\n- Change facial expression to ${options.expression}.`;
    } else {
      prompt += `\n\n- Maintain the skin tone of the TARGET IMAGE unless it conflicts heavily with the SOURCE IDENTITY, in which case blend them naturally.`;
    }

    // Apply Style Instruction
    if (options.styleImage) {
      prompt += `\n\nSTYLE INSTRUCTION: Apply the artistic style, color palette, and visual texture of the STYLE REFERENCE image to the final output. The result should look like it was created in that style, while maintaining the face swap content.`;
    }

    if (options.fidelity === 'high') {
      prompt += `\n\nFIDELITY MODE: HIGH (MAXIMUM REALISM). Prioritize hyper-realistic blending and texture matching (pores, wrinkles, eye reflections). The identity must be instantly recognizable as the Source, but the photo must look exactly like the Target with perfect lighting alignment.`;
    } else if (options.fidelity === 'artistic') {
      prompt += `\n\nFIDELITY MODE: ARTISTIC. Allow for creative interpretation of lighting and mood. Prioritize aesthetic appeal, adjusting color grading and shadows to create a dramatic, cohesive look while keeping the identity recognizable.`;
    } else {
      prompt += `\n\nFIDELITY MODE: STANDARD. Balance identity retention with seamless blending. Ensure the face looks natural in the target environment with accurate skin tone matching.`;
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    // Iterate through parts to find the image
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${base64EncodeString}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error swapping face:", error);
    throw error;
  }
}

export async function extractPromptFromImage(base64Image: string): Promise<string> {
  try {
    const ai = getAiClient();
    const parts: any[] = [];
    
    const match = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
    
    parts.push({ text: "Describe this image in detail. Focus on the main subject, setting, lighting, style, and colors. Provide a description suitable for use as an image generation prompt. Return ONLY the description." });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: { parts },
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error extracting prompt:", error);
    throw error;
  }
}

export async function generatePromptIdeas(topic?: string): Promise<string[]> {
  try {
    const ai = getAiClient();
    const prompt = topic 
      ? `Generate 5 creative, detailed, and artistic image generation prompts based on the topic: "${topic}". Each prompt should be unique and descriptive. Return ONLY the prompts as a JSON array of strings. No markdown formatting.`
      : `Generate 5 creative, diverse, and trending image generation prompts. They should cover different styles (e.g., photorealistic, cyberpunk, fantasy, abstract). Return ONLY the prompts as a JSON array of strings. No markdown formatting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: prompt,
    });

    const text = response.text?.trim() || "[]";
    // Clean up potential markdown code blocks
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Failed to parse prompt ideas JSON, returning raw text lines", e);
      return text.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    }
  } catch (error) {
    console.error("Error generating prompt ideas:", error);
    return [
      "A futuristic city with neon lights and flying cars, cyberpunk style, 8k resolution",
      "A serene landscape with a mountain lake at sunset, photorealistic, cinematic lighting",
      "A cute robot gardening in a greenhouse, pixar style, vibrant colors",
      "An abstract composition of geometric shapes and fluid lines, modern art",
      "A portrait of a warrior in detailed armor, fantasy concept art, dramatic lighting"
    ];
  }
}
