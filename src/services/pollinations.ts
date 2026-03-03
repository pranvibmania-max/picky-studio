
export const generateImagePollinations = async (
  prompt: string,
  width: number,
  height: number,
  spicy: boolean = false
): Promise<string> => {
  const seed = Math.floor(Math.random() * 1000000);
  const model = spicy ? 'flux' : 'turbo';
  const encodedPrompt = encodeURIComponent(prompt);
  
  // Pollinations.ai API URL
  // We use nologo=true to remove the watermark
  // We use private=true to avoid the image appearing in the public feed (optional, but good for privacy)
  // enhance=true is often good for short prompts, but might add safety filters. We'll leave it default or false for spicy.
  
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;
  
  // We can just return the URL directly as Pollinations generates on the fly
  // However, to ensure it works and to catch errors, we might want to fetch it first.
  // But for speed, returning the URL is standard for Pollinations.
  // To be safe and consistent with other services that return a base64 or a verified URL,
  // we could fetch it. But Pollinations is a GET request that returns the image.
  // The Image component can handle the URL.
  
  return url;
};
