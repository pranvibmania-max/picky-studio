
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
  
  // We will fetch the image so we can return a `data:` URI.  This avoids
  // potential cross‑origin problems when using the URL directly and keeps the
  // return value consistent with Gemini/OpenAI helpers (which return base64 data).
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Pollinations request failed: ${resp.status}`);
    }
    const blob = await resp.blob();
    // Convert blob to base64 string
    const reader = new FileReader();
    const dataUrl: Promise<string> = new Promise((resolve, reject) => {
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    return await dataUrl;
  } catch (err) {
    console.warn('Pollinations fetch failed, returning direct URL', err);
    return url;
  }
};
