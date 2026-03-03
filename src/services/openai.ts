export async function generateImageOpenAI(prompt: string, aspectRatio: string = "1:1", baseImage?: string): Promise<string | null> {
  try {
    const key = import.meta.env.VITE_OPENAI_API_KEY;
    if (!key) {
      throw new Error('VITE_OPENAI_API_KEY environment variable is required');
    }
    
    let finalPrompt = prompt;

    // If base image is provided, use GPT-4o to describe it and enhance the prompt
    if (baseImage) {
      try {
        const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: `Describe this image in detail so I can generate a similar one with DALL-E 3. Focus on the style, composition, colors, and subject. The user's prompt for the new image is: "${prompt}". Ensure the description supports this prompt.` },
                  {
                    type: "image_url",
                    image_url: {
                      url: baseImage
                    }
                  }
                ]
              }
            ],
            max_tokens: 300
          })
        });

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const description = visionData.choices[0]?.message?.content;
          if (description) {
            finalPrompt = `Create an image based on this description: ${description}. \n\nOriginal User Request: ${prompt}`;
            console.log("Enhanced prompt with vision:", finalPrompt);
          }
        } else {
          console.warn("Failed to analyze base image with GPT-4o, proceeding with text prompt only.");
        }
      } catch (visionError) {
        console.error("Error analyzing base image:", visionError);
        // Continue with original prompt if vision fails
      }
    }
    
    // Map aspect ratio to OpenAI format
    let size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024";
    if (aspectRatio === "16:9") size = "1792x1024";
    if (aspectRatio === "9:16") size = "1024x1792";
    if (aspectRatio === "4:3") size = "1792x1024"; // closest approximation
    if (aspectRatio === "3:4") size = "1024x1792"; // closest approximation

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: size,
        response_format: "b64_json",
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (data.data && data.data[0] && data.data[0].b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`;
    }
    
    return null;
  } catch (error) {
    console.error("Error generating image with OpenAI:", error);
    throw error;
  }
}
