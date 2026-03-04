import { useState, useRef, useEffect } from 'react';
import React from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { generateImage, improvePrompt, swapFace, extractPromptFromImage, generatePromptIdeas } from '../services/gemini';
import { generateImageOpenAI } from '../services/openai';
import { generateImagePollinations } from '../services/pollinations';
import { Loader2, Download, Sparkles, Image as ImageIcon, Shuffle, Camera, X, Layers, Wand2, Grid2x2, ChevronDown, Check, Palette, Ratio, User, Paintbrush, Settings2, Bookmark, Plus, Folder, Trash2, SlidersHorizontal, Undo, Redo, Crop as CropIcon, Share2, History as HistoryIcon, RotateCcw, Eye, Split, Dices, Lightbulb, Flame } from 'lucide-react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const promptTemplates = [
  { label: 'Character Design', value: 'A highly detailed character design of a [fantasy/sci-fi] [class/profession], wearing [clothing/armor], standing in a [setting], cinematic lighting, 8k resolution, concept art' },
  { label: 'Landscape', value: 'A breathtaking landscape of a [mountain/forest/city], during [sunrise/sunset/night], with [river/clouds/stars], photorealistic, highly detailed, 8k, majestic atmosphere' },
  { label: 'Abstract Art', value: 'Abstract art featuring [geometric shapes/fluid patterns], with a color palette of [colors], dynamic composition, vibrant, modern art style' },
  { label: 'Product Photography', value: 'Professional product photography of a [product], placed on a [surface], studio lighting, soft shadows, sharp focus, high end commercial photography' },
  { label: 'Interior Design', value: 'A modern interior design of a [living room/bedroom/kitchen], featuring [furniture style], natural lighting, cozy atmosphere, architectural photography' },
  { label: 'Cyberpunk City', value: 'A futuristic cyberpunk city street at night, neon lights, rain-slicked streets, flying cars, towering skyscrapers, highly detailed, cinematic lighting' },
  { label: 'Fantasy Castle', value: 'A majestic fantasy castle situated on a floating island, surrounded by clouds, waterfalls, magical glowing crystals, epic fantasy art' },
  { label: 'Anime Portrait', value: 'Anime style portrait of a [boy/girl] with [hair color] hair and [eye color] eyes, wearing [clothing], soft lighting, studio ghibli style, highly detailed' },
  { label: 'Vintage Poster', value: 'A vintage travel poster of [location], retro style, distressed texture, bold typography, limited color palette, 1950s aesthetic' },
  { label: 'Watercolor Illustration', value: 'A soft watercolor illustration of [subject], pastel colors, artistic, hand-painted style, wet-on-wet technique, white background' },
  { label: 'Claymation Character', value: 'A cute claymation character of a [creature/person], stop motion style, plasticine texture, studio lighting, depth of field, 3d style' },
  { label: '3D Product Render', value: 'A high-quality 3D render of a [product], isometric view, soft studio lighting, pastel background, 4k resolution, blender cycles, minimalist' },
  { label: 'Blueprint Schematic', value: 'A technical blueprint schematic of a [machine/device], white lines on blue background, detailed engineering drawing, annotations, technical diagram' }
];

const styles = [
  { label: 'Cinematic', value: 'cinematic lighting, dramatic atmosphere, high detailed' },
  { label: 'Photorealistic', value: 'photorealistic, 8k, highly detailed, real life' },
  { label: 'Watercolor', value: 'watercolor painting, soft edges, artistic' },
  { label: 'Pixel Art', value: 'pixel art, 8 bit, retro game style' },
  { label: 'Cyberpunk', value: 'cyberpunk, neon lights, futuristic, high tech' },
  { label: 'Oil Painting', value: 'oil painting, textured, classical art style' },
  { label: 'Anime', value: 'anime style, studio ghibli, vibrant colors' },
  // Clothing styles
  { label: 'Saree (Indian)', value: 'wearing a beautiful traditional indian saree, intricate embroidery, elegant' },
  { label: 'Suit (Formal)', value: 'wearing a sharp tailored suit, professional, business attire' },
  { label: 'Jeans & Shirt (Casual)', value: 'wearing denim jeans and a casual shirt, relaxed style, everyday look' },
  { label: 'Shorts (Summer)', value: 'wearing stylish shorts and a summer top, casual, warm weather outfit' },
  { label: 'Indian Traditional', value: 'wearing traditional indian ethnic wear, lehenga choli or salwar kameez, ornate jewelry' },
  { label: 'Western Dress', value: 'wearing a modern western dress, chic, fashionable' },
  { label: 'Indian Bridal', value: 'wearing traditional indian bridal lehenga, heavy jewelry, bridal makeup, intricate embroidery, henna, festive atmosphere' },
  { label: 'Western Bridal', value: 'wearing a white wedding gown, veil, bridal makeup, elegant, romantic atmosphere' },
  { label: 'High Fashion Makeup', value: 'high fashion makeup, bold colors, artistic, avant-garde, runway style, close up portrait' },
  { label: 'Glamour Makeup', value: 'glamour makeup, flawless skin, contoured, evening look, red carpet style' },
  { label: 'Beaches Photo', value: 'beaches photo, sunny, ocean view, sandy beach, relaxing' },
  { label: 'Bed Room Intimacy Photo', value: 'bed room intimacy photo, cozy, warm lighting, romantic, intimate atmosphere' },
  { label: 'Shorts and Nighty Photo', value: 'wearing shorts and a nighty, comfortable, indoor setting, casual' },
  { label: 'Bed Room Scenes', value: 'bed room scene, cozy bed, pillows, soft lighting, relaxing indoor atmosphere' },
];

const facialFeatures = {
  eyeColor: [
    { label: 'Blue Eyes', value: 'piercing blue eyes' },
    { label: 'Green Eyes', value: 'emerald green eyes' },
    { label: 'Brown Eyes', value: 'deep brown eyes' },
    { label: 'Hazel Eyes', value: 'hazel eyes' },
    { label: 'Grey Eyes', value: 'mysterious grey eyes' },
    { label: 'Amber Eyes', value: 'golden amber eyes' },
  ],
  hairColor: [
    { label: 'Blonde Hair', value: 'blonde hair' },
    { label: 'Brunette Hair', value: 'brunette hair' },
    { label: 'Black Hair', value: 'jet black hair' },
    { label: 'Red Hair', value: 'fiery red hair' },
    { label: 'White Hair', value: 'snow white hair' },
    { label: 'Silver Hair', value: 'silver hair' },
    { label: 'Pink Hair', value: 'pastel pink hair' },
    { label: 'Blue Hair', value: 'electric blue hair' },
  ],
  skinTone: [
    { label: 'Fair Skin', value: 'fair skin tone' },
    { label: 'Medium Skin', value: 'medium skin tone' },
    { label: 'Olive Skin', value: 'olive skin tone' },
    { label: 'Tan Skin', value: 'tan skin tone' },
    { label: 'Dark Skin', value: 'dark skin tone' },
    { label: 'Deep Skin', value: 'deep rich skin tone' },
  ],
  expression: [
    { label: 'Beautiful Smile', value: 'beautiful smiling face, joyful expression' },
    { label: 'Joyful', value: 'joyful face, happy expression, radiant smile' },
    { label: 'Angry', value: 'angry face, fierce expression, intense look' },
    { label: 'Normal/Neutral', value: 'normal facial look, neutral expression, calm demeanor' },
    { label: 'Confident', value: 'confident facial look, strong gaze, assured expression' },
    { label: 'Adorable', value: 'adorable facial expression, cute, charming look' },
    { label: 'Calm', value: 'calm facial expression, peaceful look, serene' },
    { label: 'Surprised', value: 'surprised face, wide eyes, shocked expression' },
    { label: 'Sad', value: 'sad face, melancholic expression, teary eyes' },
    { label: 'Thoughtful', value: 'thoughtful expression, pensive look, deep in thought' },
  ],
};

const colorPalettes = [
  { label: 'Vibrant', value: 'vibrant colors, high saturation, colorful' },
  { label: 'Pastel', value: 'pastel colors, soft tones, light colors' },
  { label: 'Monochrome', value: 'monochrome, black and white, grayscale' },
  { label: 'Warm', value: 'warm tones, orange, red, yellow, cozy' },
  { label: 'Cool', value: 'cool tones, blue, teal, purple, calm' },
  { label: 'Cyberpunk', value: 'neon colors, pink, blue, purple, glowing' },
  { label: 'Earth Tones', value: 'earth tones, brown, green, beige, natural' },
  { label: 'Vintage', value: 'vintage colors, sepia, muted tones, retro' },
];

interface SavedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

interface Collection {
  id: string;
  name: string;
  images: SavedImage[];
}

interface DropdownProps {
  label: string;
  value?: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
}

function Dropdown({ label, value, options, onChange, icon, placeholder }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = value ? options.find(o => o.value === value)?.label : placeholder || label;

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 transition-all shadow-sm"
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-zinc-500">{icon}</span>}
          <span className="truncate">{selectedLabel}</span>
        </div>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 origin-top">
          <div className="p-1 space-y-0.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between group transition-colors ${
                  value === option.value
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {value === option.value && <Check className="w-3 h-3 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('A 23 year old beautiful girl, portrait, cinematic lighting, high detail');
  const [aspectRatio, setAspectRatio] = useState(() => localStorage.getItem('aspectRatio') || '1:1');
  const [numImages, setNumImages] = useState<1 | 4>(() => {
    const saved = localStorage.getItem('numImages');
    return saved ? (parseInt(saved) as 1 | 4) : 1;
  });
  const [selectedStyles, setSelectedStyles] = useState<string[]>(() => {
    const saved = localStorage.getItem('selectedStyles');
    return saved ? JSON.parse(saved) : [];
  });
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'pollinations'>(() => {
    return (localStorage.getItem('provider') as 'gemini' | 'openai' | 'pollinations') || 'gemini';
  });
  const [spicyMode, setSpicyMode] = useState(() => {
    return localStorage.getItem('spicyMode') === 'true';
  });
  const [pollinationsWidth, setPollinationsWidth] = useState(() => {
    return parseInt(localStorage.getItem('pollinationsWidth') || '1024');
  });
  const [pollinationsHeight, setPollinationsHeight] = useState(() => {
    return parseInt(localStorage.getItem('pollinationsHeight') || '1024');
  });

  useEffect(() => {
    localStorage.setItem('spicyMode', String(spicyMode));
  }, [spicyMode]);

  useEffect(() => {
    localStorage.setItem('pollinationsWidth', pollinationsWidth.toString());
  }, [pollinationsWidth]);

  useEffect(() => {
    localStorage.setItem('pollinationsHeight', pollinationsHeight.toString());
  }, [pollinationsHeight]);
  const [mockMode, setMockMode] = useState(() => {
    return localStorage.getItem('mockMode') === 'true';
  });
  const [showMockPrompt, setShowMockPrompt] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('aspectRatio', aspectRatio);
  }, [aspectRatio]);

  useEffect(() => {
    localStorage.setItem('numImages', numImages.toString());
  }, [numImages]);

  useEffect(() => {
    localStorage.setItem('selectedStyles', JSON.stringify(selectedStyles));
  }, [selectedStyles]);

  useEffect(() => {
    localStorage.setItem('provider', provider);
  }, [provider]);

  const [selectedPalette, setSelectedPalette] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('mockMode', String(mockMode));
  }, [mockMode]);

  // Collection State
  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('collections');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('collections', JSON.stringify(collections));
  }, [collections]);

  const [variations, setVariations] = useState<string[]>([]);
  const [history, setHistory] = useState<Array<{ id: string; prompt: string; image: string; aspectRatio: string; timestamp: number }>>([]);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [promptIdeas, setPromptIdeas] = useState<string[]>([]);
  const [showPromptIdeas, setShowPromptIdeas] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'collections' | 'faceswap'>('generate');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Face Swap State
  const [faceSwapTarget, setFaceSwapTarget] = useState<string | null>(null);
  const [faceSwapSource, setFaceSwapSource] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swappedImage, setSwappedImage] = useState<string | null>(null);
  const [faceSwapFidelity, setFaceSwapFidelity] = useState<'standard' | 'high' | 'artistic'>('high');
  const [faceSwapMaskingMode, setFaceSwapMaskingMode] = useState<'full' | 'internal' | 'eyes' | 'mouth'>('full');
  const [faceSwapEyeColor, setFaceSwapEyeColor] = useState<string>('');
  const [faceSwapHairColor, setFaceSwapHairColor] = useState<string>('');
  const [faceSwapSkinTone, setFaceSwapSkinTone] = useState<string>('');
  const [faceSwapExpression, setFaceSwapExpression] = useState<string>('');
  const [faceSwapStyleImage, setFaceSwapStyleImage] = useState<string | null>(null);

  // Collection State
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedImageForCollection, setSelectedImageForCollection] = useState<{url: string, prompt: string} | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [viewingCollection, setViewingCollection] = useState<Collection | null>(null);

  // Image adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sepia, setSepia] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [invert, setInvert] = useState(0);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<'none' | 'split' | 'side-by-side'>('none');
  const [comparisonImage, setComparisonImage] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);

  // Advanced Features
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Style Transfer
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [isStyleCameraOpen, setIsStyleCameraOpen] = useState(false);
  const styleVideoRef = useRef<HTMLVideoElement>(null);

  // Colorize Mode
  const [isColorizing, setIsColorizing] = useState(false);

  // Cropping
  const [crop, setCrop] = useState<Crop>();
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Zoom
  const [zoom, setZoom] = useState(1);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (isCropping) return;
    
    // Prevent default scrolling behavior when zooming
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }

    const delta = -e.deltaY * 0.001;
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 5));
  };

  useEffect(() => {
    // Reset zoom when image changes
    setZoom(1);
  }, [image]);

  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const preventDefault = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', preventDefault, { passive: false });
    return () => container.removeEventListener('wheel', preventDefault);
  }, []);

  type AdjustmentState = { brightness: number, contrast: number, saturation: number, sepia: number, grayscale: number, invert: number };
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentState[]>([{ brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: 0, invert: 0 }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const commitAdjustment = () => {
    const newState = { brightness, contrast, saturation, sepia, grayscale, invert };
    const currentState = adjustmentHistory[historyIndex];
    if (currentState && 
        currentState.brightness === newState.brightness &&
        currentState.contrast === newState.contrast &&
        currentState.saturation === newState.saturation &&
        currentState.sepia === newState.sepia &&
        currentState.grayscale === newState.grayscale &&
        currentState.invert === newState.invert) {
      return;
    }

    const newHistory = adjustmentHistory.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setAdjustmentHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undoAdjustment = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = adjustmentHistory[newIndex];
      setBrightness(state.brightness);
      setContrast(state.contrast);
      setSaturation(state.saturation);
      setSepia(state.sepia);
      setGrayscale(state.grayscale);
      setInvert(state.invert);
    }
  };

  const redoAdjustment = () => {
    if (historyIndex < adjustmentHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = adjustmentHistory[newIndex];
      setBrightness(state.brightness);
      setContrast(state.contrast);
      setSaturation(state.saturation);
      setSepia(state.sepia);
      setGrayscale(state.grayscale);
      setInvert(state.invert);
    }
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSepia(0);
    setGrayscale(0);
    setInvert(0);
    const newState = { brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: 0, invert: 0 };
    const currentState = adjustmentHistory[historyIndex];
    if (currentState && 
        currentState.brightness === newState.brightness &&
        currentState.contrast === newState.contrast &&
        currentState.saturation === newState.saturation &&
        currentState.sepia === newState.sepia &&
        currentState.grayscale === newState.grayscale &&
        currentState.invert === newState.invert) {
      return;
    }
    const newHistory = adjustmentHistory.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setAdjustmentHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const resetAdjustmentHistory = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSepia(0);
    setGrayscale(0);
    setInvert(0);
    setAdjustmentHistory([{ brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: 0, invert: 0 }]);
    setHistoryIndex(0);
  };

  const handleImprovePrompt = async () => {
    if (!prompt.trim()) return;
    
    setImproving(true);
    try {
      const improved = await improvePrompt(prompt);
      setPrompt(improved);
    } catch (err) {
      console.error("Failed to improve prompt", err);
    } finally {
      setImproving(false);
    }
  };

  const handleGetIdeas = async () => {
    setGeneratingIdeas(true);
    setShowPromptIdeas(true);
    try {
      // Use current prompt as topic if it's short, otherwise random
      const topic = prompt.length < 50 && prompt.length > 3 ? prompt : undefined;
      const ideas = await generatePromptIdeas(topic);
      setPromptIdeas(ideas);
    } catch (err) {
      console.error("Failed to get ideas", err);
    } finally {
      setGeneratingIdeas(false);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setBaseImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaseImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractPrompt = async () => {
    if (!baseImage) return;
    
    setIsExtracting(true);
    try {
      const extractedPrompt = await extractPromptFromImage(baseImage);
      if (extractedPrompt) {
        setPrompt(extractedPrompt);
      }
    } catch (error) {
      console.error("Failed to extract prompt:", error);
      setError("Failed to extract prompt from image.");
    } finally {
      setIsExtracting(false);
    }
  };

  const clearBaseImage = () => {
    setBaseImage(null);
  };

  const startStyleCamera = async () => {
    try {
      setIsStyleCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (styleVideoRef.current) {
        styleVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
      setIsStyleCameraOpen(false);
    }
  };

  const stopStyleCamera = () => {
    if (styleVideoRef.current && styleVideoRef.current.srcObject) {
      const stream = styleVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      styleVideoRef.current.srcObject = null;
    }
    setIsStyleCameraOpen(false);
  };

  const captureStylePhoto = () => {
    if (styleVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = styleVideoRef.current.videoWidth;
      canvas.height = styleVideoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(styleVideoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setStyleImage(dataUrl);
        stopStyleCamera();
      }
    }
  };

  const handleStyleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStyleImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearStyleImage = () => {
    setStyleImage(null);
  };

  const removeStyle = (styleLabel: string) => {
    setSelectedStyles(prev => prev.filter(s => s !== styleLabel));
  };

  const handleRandomStyle = () => {
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    setSelectedStyles([randomStyle.label]);
  };

  const generateMockImage = async (promptText: string, ratio: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
    const width = ratio === '16:9' ? 1024 : ratio === '9:16' ? 576 : 1024;
    const height = ratio === '16:9' ? 576 : ratio === '9:16' ? 1024 : 1024;
    return `https://picsum.photos/seed/${encodeURIComponent(promptText)}/${width}/${height}`;
  };

  const generateImageWithFallback = async (promptText: string, ratio: string, baseImg?: string, styleImg?: string) => {
    if (mockMode) {
      return await generateMockImage(promptText, ratio);
    }

    // If Pollinations is explicitly selected
    if (provider === 'pollinations') {
      try {
        return await generateImagePollinations(promptText, pollinationsWidth, pollinationsHeight, spicyMode);
      } catch (error: any) {
        console.warn("Pollinations generation failed, falling back to Gemini", error);
        setWarning("Pollinations generation failed. Falling back to Gemini.");
        // Fallback to Gemini
      }
    }

    // If OpenAI is explicitly selected, try it first
    if (provider === 'openai') {
      try {
        if (styleImg) {
          setWarning("ChatGPT 4.0 does not support direct style transfer. Style reference will be ignored.");
        } else if (baseImg) {
          setWarning("Using ChatGPT 4.0 to analyze reference image and generate a new variation.");
        }
        return await generateImageOpenAI(promptText, ratio, baseImg || undefined);
      } catch (error: any) {
        console.warn("OpenAI generation failed, falling back to Gemini", error);
        
        // Check for billing error specifically
        const isBillingError = error?.message?.includes('billing_hard_limit_reached') || 
                               JSON.stringify(error).includes('billing_hard_limit_reached');
        
        if (isBillingError) {
           setWarning("ChatGPT 4.0 billing limit reached. Falling back to Gemini.");
        } else {
           setWarning("ChatGPT 4.0 generation failed. Falling back to Gemini.");
        }

        try {
          return await generateImage(promptText, ratio, baseImg, styleImg);
        } catch (fallbackError: any) {
          console.error("Gemini fallback also failed", fallbackError);
          if (fallbackError?.message?.includes('429') || fallbackError?.message?.includes('quota')) {
             setShowMockPrompt(true);
             throw new Error("API limits reached for both providers.");
          }
          throw fallbackError;
        }
      }
    }

    // Default: Try Gemini first
    try {
      return await generateImage(promptText, ratio, baseImg, styleImg);
    } catch (error: any) {
      const errorMessage = error?.message?.toLowerCase() || '';
      const isLimitError = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('exhausted');
      
      if (isLimitError) {
        console.warn("Gemini limit reached, falling back to OpenAI API", error);
        if (baseImg || styleImg) {
          setWarning("Gemini limit reached. Falling back to ChatGPT 4.0 (reference images will be ignored).");
        } else {
          setWarning("Gemini limit reached. Falling back to ChatGPT 4.0.");
        }
        try {
          return await generateImageOpenAI(promptText, ratio);
        } catch (fallbackError: any) {
          console.error("OpenAI fallback also failed", fallbackError);
          const isBillingError = fallbackError?.message?.includes('billing_hard_limit_reached') || 
                                 JSON.stringify(fallbackError).includes('billing_hard_limit_reached');
          
          if (isBillingError) {
            setShowMockPrompt(true);
            throw new Error("API limits reached for both providers.");
          }
          throw fallbackError;
        }
      }
      
      // If it's not a limit error, still try to fallback just in case
      console.warn("Gemini generation failed, falling back to OpenAI API", error);
      if (baseImg || styleImg) {
        setWarning("Gemini generation failed. Falling back to ChatGPT 4.0 (reference images will be ignored).");
      } else {
        setWarning("Gemini generation failed. Falling back to ChatGPT 4.0.");
      }
      try {
        return await generateImageOpenAI(promptText, ratio);
      } catch (fallbackError: any) {
        console.error("OpenAI fallback also failed", fallbackError);
        const isBillingError = fallbackError?.message?.includes('billing_hard_limit_reached') || 
                               JSON.stringify(fallbackError).includes('billing_hard_limit_reached');
        
        if (isBillingError) {
            setShowMockPrompt(true);
            throw new Error("API limits reached for both providers.");
        }
        throw fallbackError;
      }
    }
  };

  const handleColorize = async () => {
    if (!baseImage) {
      setError('Please upload a black and white image first.');
      return;
    }
    
    setIsColorizing(true);
    setPrompt('Colorize this black and white image, highly detailed, realistic colors, 8k resolution');
    
    // Trigger generation after a short delay to allow state update
    setTimeout(() => {
      handleGenerate();
    }, 100);
  };

  const handleGenerate = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setWarning(null);
    setShowMockPrompt(false);
    setImage(null);
    setVariations([]);
    resetAdjustmentHistory();

    if (!isColorizing) {
      // If not in colorize mode, reset it just in case
      setIsColorizing(false);
    }

    try {
      // Construct full prompt with styles
      let fullPrompt = prompt;
      
      if (baseImage && !isColorizing) {
        const lowerPrompt = prompt.toLowerCase();
        const wantsFaceChange = lowerPrompt.includes('change face') || lowerPrompt.includes('different face') || lowerPrompt.includes('new face');
        if (!wantsFaceChange) {
          fullPrompt += ", DO NOT CHANGE THE FACE OF THE MODEL, preserve the facial features exactly as in the reference image";
        }
      }

      if (selectedStyles.length > 0) {
        const styleValues = selectedStyles
          .map(label => styles.find(s => s.label === label)?.value)
          .filter(Boolean)
          .join(', ');
        fullPrompt = `${fullPrompt}, ${styleValues}`;
      }

      if (selectedPalette) {
        const paletteValue = colorPalettes.find(p => p.label === selectedPalette)?.value;
        if (paletteValue) {
          fullPrompt = `${fullPrompt}, ${paletteValue}`;
        }
      }

      // Append negative prompt if present
      if (negativePrompt.trim()) {
        fullPrompt = `${fullPrompt} --no ${negativePrompt.trim()}`;
      }

      // Append seed if present
      if (seed.trim()) {
         // Note: Seed handling depends on the backend/API support. 
         // For Gemini, we might append it to the prompt or use it in config if supported.
         // Here we append it as a directive for the model.
         fullPrompt = `${fullPrompt} --seed ${seed.trim()}`;
      }

      if (numImages === 1) {
        const result = await generateImageWithFallback(fullPrompt, aspectRatio, baseImage || undefined, styleImage || undefined);
        if (result) {
          setImage(result);
          setHistory(prev => [{
            id: Date.now().toString(),
            prompt: fullPrompt,
            image: result,
            aspectRatio,
            timestamp: Date.now()
          }, ...prev]);
        } else {
          setError('No image was generated. Please try a different prompt.');
        }
      } else {
        // Generate 4 images
        const promises = Array(4).fill(null).map(() => 
          generateImageWithFallback(fullPrompt, aspectRatio, baseImage || undefined, styleImage || undefined)
            .catch(e => {
              console.error(e);
              return null;
            })
        );
        
        const results = await Promise.all(promises);
        const successfulImages = results.filter((res): res is string => res !== null);
        
        if (successfulImages.length > 0) {
          setImage(successfulImages[0]);
          setVariations(successfulImages);
          
          // Add to history
          const newHistoryItems = successfulImages.map((img, idx) => ({
            id: `${Date.now()}-${idx}`,
            prompt: fullPrompt,
            image: img,
            aspectRatio,
            timestamp: Date.now()
          }));
          setHistory(prev => [...newHistoryItems, ...prev]);
        } else {
           setError('No images were generated. Please try a different prompt.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariations = async () => {
    if (!image || !prompt.trim()) return;

    setLoading(true);
    setError(null);
    setVariations([]);

    try {
      // Construct full prompt with styles
      let fullPrompt = prompt;
      
      if (image) {
        const lowerPrompt = prompt.toLowerCase();
        const wantsFaceChange = lowerPrompt.includes('change face') || lowerPrompt.includes('different face') || lowerPrompt.includes('new face');
        if (!wantsFaceChange) {
          fullPrompt += ", DO NOT CHANGE THE FACE OF THE MODEL, preserve the facial features exactly as in the reference image";
        }
      }

      if (selectedStyles.length > 0) {
        const styleValues = selectedStyles
          .map(label => styles.find(s => s.label === label)?.value)
          .filter(Boolean)
          .join(', ');
        fullPrompt = `${fullPrompt}, ${styleValues}`;
      }

      if (selectedPalette) {
        const paletteValue = colorPalettes.find(p => p.label === selectedPalette)?.value;
        if (paletteValue) {
          fullPrompt = `${fullPrompt}, ${paletteValue}`;
        }
      }

      // Generate 4 variations in parallel
      const variationPromises = Array(4).fill(null).map(() => 
        generateImageWithFallback(fullPrompt, aspectRatio, image, styleImage || undefined)
      );

      const results = await Promise.all(variationPromises);
      const successfulVariations = results.filter((res): res is string => res !== null);

      if (successfulVariations.length > 0) {
        setVariations(successfulVariations);
        // Add variations to history as well
        const newHistoryItems = successfulVariations.map((varImage, index) => ({
          id: `${Date.now()}-${index}`,
          prompt: `${fullPrompt} (Variation)`,
          image: varImage,
          aspectRatio,
          timestamp: Date.now()
        }));
        setHistory(prev => [...newHistoryItems, ...prev]);
      } else {
        setError('Failed to generate variations. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate variations');
    } finally {
      setLoading(false);
    }
  };



  const handleCropComplete = () => {
    if (!imgRef.current || !crop || !image) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        imgRef.current,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      const croppedImageUrl = canvas.toDataURL('image/png');
      setImage(croppedImageUrl);
      setIsCropping(false);
      setCrop(undefined);
    }
  };

  const handleDownload = async () => {
    if (!image) return;
    
    // If no adjustments, just download directly
    if (brightness === 100 && contrast === 100 && saturation === 100 && sepia === 0 && grayscale === 0 && invert === 0) {
      try {
        // If it's a remote URL (like Pollinations), fetch it first to ensure download attribute works
        if (image.startsWith('http')) {
          const response = await fetch(image);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `generated-image-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          // Data URL
          const link = document.createElement('a');
          link.href = image;
          link.download = `generated-image-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (err) {
        console.error("Download failed:", err);
        // Fallback to opening in new tab
        window.open(image, '_blank');
      }
      return;
    }

    // Apply filters via canvas
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) grayscale(${grayscale}%) invert(${invert}%)`;
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `generated-image-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = image;
  };

  const handleShare = async () => {
    if (!image) return;
    
    try {
      // Create a canvas to apply filters before sharing
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      const shareImage = await new Promise<string>((resolve) => {
        img.onload = () => {
          if (brightness === 100 && contrast === 100 && saturation === 100 && sepia === 0 && grayscale === 0 && invert === 0) {
            resolve(image);
            return;
          }
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(image);
            return;
          }
          
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) grayscale(${grayscale}%) invert(${invert}%)`;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = image;
      });

      const response = await fetch(shareImage);
      const blob = await response.blob();
      const file = new File([blob], 'gemini-generated.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Generated with AI',
          text: `Prompt: ${prompt}`,
          files: [file],
        });
      } else {
        // Fallback: Copy to clipboard
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [file.type]: file,
            }),
          ]);
          await navigator.clipboard.writeText(`Prompt: ${prompt}`);
          alert('Image and prompt copied to clipboard!');
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError);
          alert('Sharing is not supported on this browser and copying to clipboard failed.');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share image.');
    }
  };

  const restoreHistoryItem = (item: typeof history[0]) => {
    setPrompt(item.prompt);
    setAspectRatio(item.aspectRatio);
    setImage(item.image);
    setSelectedStyles([]); // Clear styles as they are included in the saved prompt
    resetAdjustmentHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const openCollectionModal = (imageUrl: string, imagePrompt: string) => {
    setSelectedImageForCollection({ url: imageUrl, prompt: imagePrompt });
    setShowCollectionModal(true);
  };

  const createCollection = () => {
    if (!newCollectionName.trim()) return;
    const newCollection: Collection = {
      id: Date.now().toString(),
      name: newCollectionName.trim(),
      images: []
    };
    setCollections(prev => [...prev, newCollection]);
    setNewCollectionName('');
  };

  const addToCollection = (collectionId: string) => {
    if (!selectedImageForCollection) return;
    
    setCollections(prev => prev.map(col => {
      if (col.id === collectionId) {
        // Check if image already exists in collection
        if (col.images.some(img => img.url === selectedImageForCollection.url)) {
          return col;
        }
        return {
          ...col,
          images: [...col.images, {
            id: Date.now().toString(),
            url: selectedImageForCollection.url,
            prompt: selectedImageForCollection.prompt,
            timestamp: Date.now()
          }]
        };
      }
      return col;
    }));
    setShowCollectionModal(false);
    setSelectedImageForCollection(null);
  };

  const deleteCollection = (collectionId: string) => {
    setCollections(prev => prev.filter(c => c.id !== collectionId));
    if (viewingCollection?.id === collectionId) {
      setViewingCollection(null);
    }
  };

  const removeFromCollection = (collectionId: string, imageId: string) => {
    setCollections(prev => prev.map(col => {
      if (col.id === collectionId) {
        return {
          ...col,
          images: col.images.filter(img => img.id !== imageId)
        };
      }
      return col;
    }));
    
    // Update viewing collection if open
    if (viewingCollection && viewingCollection.id === collectionId) {
      setViewingCollection(prev => prev ? {
        ...prev,
        images: prev.images.filter(img => img.id !== imageId)
      } : null);
    }
  };

  const handleFaceSwap = async () => {
    if (!faceSwapTarget || !faceSwapSource) {
      setError("Please upload both a target image and a source face image.");
      return;
    }
    
    setIsSwapping(true);
    setError(null);
    
    try {
      const result = await swapFace(faceSwapTarget, faceSwapSource, { 
        fidelity: faceSwapFidelity,
        maskingMode: faceSwapMaskingMode,
        eyeColor: faceSwapEyeColor,
        hairColor: faceSwapHairColor,
        skinTone: faceSwapSkinTone,
        expression: faceSwapExpression,
        styleImage: faceSwapStyleImage || undefined
      });
      if (result) {
        setSwappedImage(result);
        // Add to history
        const newHistoryItem = {
          id: Date.now().toString(),
          prompt: "Face Swap",
          image: result,
          aspectRatio: "1:1",
          timestamp: Date.now()
        };
        setHistory(prev => [newHistoryItem, ...prev]);
      } else {
        setError("Failed to swap face. Please try again.");
      }
    } catch (err: any) {
      console.error("Face swap error:", err);
      setError(err.message || "Failed to swap face");
    } finally {
      setIsSwapping(false);
    }
  };

  const handleTargetUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaceSwapTarget(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSourceUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaceSwapSource(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompareMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (comparisonMode !== 'split' || !imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 md:space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1 flex items-center gap-3">
          {/* professional logo - replace "/logo.svg" with your actual asset in the public folder */}
          <img src="/logo.svg" alt="Picky Studio logo" className="w-10 h-10" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text animate-pulse">
            Picky Studio
          </h1>
          <p className="text-zinc-400 text-sm">
            Professional Image Generation Suite
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-zinc-900/50 border border-zinc-800 rounded-lg backdrop-blur-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'generate'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/20'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'collections'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/20'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => setActiveTab('faceswap')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'faceswap'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/20'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Face Swap
          </button>
        </div>
      </div>

      <div className={`space-y-8 ${activeTab === 'generate' ? '' : 'hidden'}`}>
          <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800 p-6 space-y-6">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {promptTemplates.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => setPrompt(template.value)}
                  className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors border border-zinc-700/50"
                >
                  {template.label}
                </button>
              ))}
            </div>
            <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your imagination..."
              className="relative w-full min-h-[120px] p-4 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none text-white placeholder-zinc-600 transition-all text-base leading-relaxed"
              disabled={loading}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={handleGetIdeas}
                disabled={generatingIdeas}
                className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-500/20"
                title="Get Creative Ideas"
              >
                {generatingIdeas ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lightbulb className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleImprovePrompt}
                disabled={improving || !prompt.trim()}
                className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500/20"
                title="Enhance Prompt"
              >
                {improving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
              </button>
              <span className="text-[10px] font-mono text-zinc-600">
                {prompt.length} chars
              </span>
            </div>
          </div>
          </div>

          {/* Prompt Ideas Panel */}
          {showPromptIdeas && (
            <div className="mt-2 p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Creative Ideas
                  </h4>
                </div>
                <button 
                  onClick={() => setShowPromptIdeas(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {generatingIdeas ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-500">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  <span className="text-xs">Generating creative prompts...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {promptIdeas.map((idea, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(idea);
                        setShowPromptIdeas(false);
                      }}
                      className="w-full text-left p-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/30 transition-all text-xs text-zinc-300 hover:text-white group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative">{idea}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Styles Tags */}
          {selectedStyles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedStyles.map((style) => (
                <div
                  key={style}
                  className="group relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 overflow-hidden transition-all hover:border-indigo-500/50 hover:text-white hover:shadow-[0_0_10px_-3px_rgba(99,102,241,0.3)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative">{style}</span>
                  <button
                    type="button"
                    onClick={() => removeStyle(style)}
                    className="relative hover:text-red-400 cursor-pointer transition-colors p-0.5 rounded-full hover:bg-white/10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-1 bg-zinc-950 rounded-lg p-1 border border-zinc-800 shadow-inner">
              <button
                type="button"
                onClick={() => setNumImages(1)}
                className={`group relative p-2 rounded-md transition-all ${
                  numImages === 1 
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white/10' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Generate 1 Image"
              >
                {numImages === 1 && (
                  <div className="absolute inset-0 rounded-md bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                )}
                <ImageIcon className={`w-4 h-4 transition-transform ${numImages === 1 ? 'scale-110 text-white' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setNumImages(4)}
                className={`group relative p-2 rounded-md transition-all ${
                  numImages === 4
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white/10' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
                title="Generate 4 Images"
              >
                {numImages === 4 && (
                  <div className="absolute inset-0 rounded-md bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                )}
                <Grid2x2 className={`w-4 h-4 transition-transform ${numImages === 4 ? 'scale-110 text-white' : ''}`} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium border overflow-hidden ${
                showSettings
                  ? 'bg-zinc-900 text-white border-indigo-500/30 shadow-[0_0_15px_-5px_rgba(99,102,241,0.2)]'
                  : 'bg-transparent text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-zinc-200 hover:border-zinc-800'
              }`}
            >
              {showSettings && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none" />
              )}
              <Settings2 className={`w-4 h-4 transition-colors ${showSettings ? 'text-indigo-400' : 'group-hover:text-zinc-300'}`} />
              <span className="relative">Settings</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSettings ? 'rotate-180 text-indigo-400' : ''}`} />
            </button>
          </div>

          {/* Collapsible Settings Panel */}
          {showSettings && (
            <div className="space-y-6 p-6 bg-zinc-950/50 rounded-xl border border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* AI Provider Section */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Model Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setProvider('gemini')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                      provider === 'gemini'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/20'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span>Gemini</span>
                    {provider === 'gemini' && <Check className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('openai')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                      provider === 'openai'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/20'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span>ChatGPT 4.0</span>
                    {provider === 'openai' && <Check className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('pollinations')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                      provider === 'pollinations'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/20'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span>Pollinations (Free)</span>
                    {provider === 'pollinations' && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Spicy Mode Toggle (Pollinations Only) */}
              {provider === 'pollinations' && (
                <>
                  <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg border border-red-900/30 shadow-[0_0_15px_-5px_rgba(220,38,38,0.1)]">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-red-500" />
                        Spicy Mode
                      </label>
                      <p className="text-xs text-zinc-500">
                        Uncensored generation using Flux model. Use responsibly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSpicyMode(!spicyMode)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                        spicyMode ? 'bg-red-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          spicyMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                    <label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                      <Ratio className="w-4 h-4 text-indigo-500" />
                      Image Dimensions
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-400">Width</label>
                        <input
                          type="number"
                          min="64"
                          max="2048"
                          step="64"
                          value={pollinationsWidth}
                          onChange={(e) => setPollinationsWidth(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-400">Height</label>
                        <input
                          type="number"
                          min="64"
                          max="2048"
                          step="64"
                          value={pollinationsHeight}
                          onChange={(e) => setPollinationsHeight(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { w: 1024, h: 1024, label: '1:1' },
                        { w: 1280, h: 720, label: '16:9' },
                        { w: 720, h: 1280, label: '9:16' },
                        { w: 1024, h: 768, label: '4:3' },
                        { w: 768, h: 1024, label: '3:4' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setPollinationsWidth(preset.w);
                            setPollinationsHeight(preset.h);
                          }}
                          className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded border border-zinc-700 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Mock Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Mock Mode (Free)
                  </label>
                  <p className="text-xs text-zinc-500">
                    Use placeholder images for testing without API costs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMockMode(!mockMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                    mockMode ? 'bg-indigo-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      mockMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Aspect Ratio Section */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Ratio className="w-3.5 h-3.5" />
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: 'Square (1:1)', value: '1:1' },
                    { label: 'Landscape (16:9)', value: '16:9' },
                    { label: 'Portrait (9:16)', value: '9:16' },
                    { label: 'Standard (4:3)', value: '4:3' },
                    { label: 'Portrait (3:4)', value: '3:4' },
                  ].map((ratio) => (
                    <button
                      key={ratio.value}
                      type="button"
                      onClick={() => setAspectRatio(ratio.value)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                        aspectRatio === ratio.value
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-900/20'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider hover:text-zinc-200 transition-colors"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Advanced Settings
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                
                {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-500 font-medium">Negative Prompt (What to exclude)</label>
                      <input
                        type="text"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="blur, distortion, low quality..."
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-500 font-medium">Seed (Optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={seed}
                          onChange={(e) => setSeed(e.target.value)}
                          placeholder="Random"
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setSeed(Math.floor(Math.random() * 1000000).toString())}
                          className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                          title="Generate Random Seed"
                        >
                          <Dices className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Facial Features Section */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Facial Features
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Dropdown
                    label="Eye Color"
                    placeholder="Select Eye Color"
                    options={facialFeatures.eyeColor}
                    onChange={(val) => {
                      setPrompt(prev => {
                        const trimmed = prev.trim();
                        if (!trimmed) return val;
                        return `${trimmed}, ${val}`;
                      });
                    }}
                  />
                  <Dropdown
                    label="Hair Color"
                    placeholder="Select Hair Color"
                    options={facialFeatures.hairColor}
                    onChange={(val) => {
                      setPrompt(prev => {
                        const trimmed = prev.trim();
                        if (!trimmed) return val;
                        return `${trimmed}, ${val}`;
                      });
                    }}
                  />
                  <Dropdown
                    label="Skin Tone"
                    placeholder="Select Skin Tone"
                    options={facialFeatures.skinTone}
                    onChange={(val) => {
                      setPrompt(prev => {
                        const trimmed = prev.trim();
                        if (!trimmed) return val;
                        return `${trimmed}, ${val}`;
                      });
                    }}
                  />
                  <Dropdown
                    label="Expression"
                    placeholder="Select Expression"
                    options={facialFeatures.expression}
                    onChange={(val) => {
                      setPrompt(prev => {
                        const trimmed = prev.trim();
                        if (!trimmed) return val;
                        return `${trimmed}, ${val}`;
                      });
                    }}
                  />
                </div>
              </div>

              {/* Styles Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Paintbrush className="w-3.5 h-3.5" />
                    Artistic Style
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomStyle}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors"
                  >
                    <Shuffle className="w-3 h-3" />
                    Randomize
                  </button>
                </div>
                
                <Dropdown
                  label="Select Artistic Style"
                  placeholder="Choose a style..."
                  value={selectedStyles[0] || ''}
                  options={styles.map(s => ({ label: s.label, value: s.label }))}
                  onChange={(val) => setSelectedStyles([val])}
                />
              </div>

              {/* Color Palette Section */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" />
                  Color Palette
                </label>
                <Dropdown
                  label="Select Color Palette"
                  placeholder="Choose a palette..."
                  value={colorPalettes.find(p => p.label === selectedPalette)?.value}
                  options={colorPalettes}
                  onChange={(val) => {
                    const paletteObj = colorPalettes.find(p => p.value === val);
                    if (paletteObj) {
                      setSelectedPalette(paletteObj.label);
                    }
                  }}
                />
              </div>

              {/* Camera Section */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5" />
                  Image Reference
                </label>
                
                {!isCameraOpen && !baseImage && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      disabled={loading}
                    >
                      <Camera className="w-4 h-4" />
                      Take Photo
                    </button>
                    <label className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium cursor-pointer">
                      <ImageIcon className="w-4 h-4" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </div>
                )}

                {isCameraOpen && (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full max-w-md mx-auto">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-6 py-2 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-colors shadow-lg cursor-pointer"
                      >
                        Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-6 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {baseImage && (
                  <div className="relative self-start group inline-block">
                    <img
                      src={baseImage}
                      alt="Base"
                      className="h-32 w-auto rounded-lg border border-gray-200 dark:border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={clearBaseImage}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={handleExtractPrompt}
                      disabled={isExtracting}
                      className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                      title="Extract prompt from image"
                    >
                      {isExtracting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Style Reference Section */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Paintbrush className="w-3.5 h-3.5" />
                  Style Reference
                </label>
                
                {!isStyleCameraOpen && !styleImage && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startStyleCamera}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      disabled={loading}
                    >
                      <Camera className="w-4 h-4" />
                      Take Photo
                    </button>
                    <label className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium cursor-pointer">
                      <ImageIcon className="w-4 h-4" />
                      Upload Style
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStyleFileUpload}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </div>
                )}

                {isStyleCameraOpen && (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full max-w-md mx-auto">
                    <video
                      ref={styleVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button
                        type="button"
                        onClick={captureStylePhoto}
                        className="px-6 py-2 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-colors shadow-lg cursor-pointer"
                      >
                        Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopStyleCamera}
                        className="px-6 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {styleImage && (
                  <div className="relative w-full">
                    <img
                      src={styleImage}
                      alt="Style Reference"
                      className="w-full h-auto rounded-xl border border-zinc-800 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={clearStyleImage}
                      className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-red-500/90 transition-all cursor-pointer border border-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

            {/* Colorize Button */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!baseImage) {
                    setError('Please upload a black and white image first.');
                    return;
                  }
                  setIsColorizing(true);
                  setPrompt('Colorize this black and white image, highly detailed, realistic colors, 8k resolution');
                  // Use setTimeout to ensure state updates before generation
                  setTimeout(() => {
                    const event = new Event('submit', { cancelable: true });
                    handleGenerate(event as unknown as FormEvent);
                  }, 100);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer border border-white/10"
              >
                <Palette className="w-4 h-4" />
                Colorize B&W Photo
              </button>
            </div>

            <button
              type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer border border-white/10"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="animate-pulse">Generating Masterpiece...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Image
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex flex-col gap-2">
            <p>{error}</p>
            {showMockPrompt && (
              <button
                onClick={() => {
                  setMockMode(true);
                  setShowMockPrompt(false);
                  setError(null);
                  // Retry generation immediately
                  setTimeout(() => handleGenerate(), 100);
                }}
                className="self-start px-3 py-1.5 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-md text-xs font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Enable Mock Mode & Retry
              </button>
            )}
          </div>
        )}

        {warning && (
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 text-sm">
            {warning}
          </div>
        )}

        <div 
          ref={imageContainerRef}
          className="relative min-h-[300px] md:min-h-[400px] rounded-xl bg-zinc-950 flex items-center justify-center overflow-hidden border border-zinc-800 shadow-2xl touch-none"
          onWheel={handleWheel}
          onMouseMove={(e) => {
            if (comparisonMode === 'split') {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
              setSliderPosition((x / rect.width) * 100);
            }
          }}
          onTouchMove={(e) => {
            if (comparisonMode === 'split') {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
              setSliderPosition((x / rect.width) * 100);
            }
          }}
        >
          {image ? (
            <div
              className="relative w-full h-full flex flex-col items-center animate-in fade-in zoom-in duration-300"
            >
              {isCropping ? (
                <div className="relative max-w-full max-h-[600px] flex flex-col items-center">
                  <ReactCrop crop={crop} onChange={c => setCrop(c)}>
                    <img
                      ref={imgRef}
                      src={image}
                      alt="Crop source"
                      className="max-w-full max-h-[500px] object-contain"
                      style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }}
                      crossOrigin="anonymous"
                    />
                  </ReactCrop>
                  <div className="absolute bottom-4 flex gap-2 z-10">
                    <button
                      onClick={handleCropComplete}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg font-medium text-sm"
                    >
                      Apply Crop
                    </button>
                    <button
                      onClick={() => {
                        setIsCropping(false);
                        setCrop(undefined);
                      }}
                      className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 shadow-lg font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    className="relative transition-transform duration-75 ease-out w-full h-full flex items-center justify-center"
                    style={{ transform: `scale(${zoom})` }}
                  >
                    {comparisonMode === 'side-by-side' ? (
                      <div className="flex gap-2 w-full h-full items-center justify-center p-4">
                        <div className="flex-1 h-full flex flex-col items-center gap-2">
                          <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                            {comparisonImage ? 'Comparison Image' : 'Original'}
                          </span>
                          <img
                            src={comparisonImage || image}
                            alt="Original"
                            className="max-w-full max-h-[500px] object-contain shadow-xl border border-zinc-800 rounded-lg"
                            crossOrigin="anonymous"
                          />
                        </div>
                        <div className="w-px h-full bg-zinc-800 mx-2" />
                        <div className="flex-1 h-full flex flex-col items-center gap-2">
                          <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">
                            {comparisonImage ? 'Current Image' : 'Adjusted'}
                          </span>
                          <img
                            src={image}
                            alt="Adjusted"
                            className="max-w-full max-h-[500px] object-contain shadow-xl border border-zinc-800 rounded-lg"
                            style={{ 
                              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) grayscale(${grayscale}%) invert(${invert}%)`
                            }}
                            crossOrigin="anonymous"
                          />
                        </div>
                      </div>
                    ) : comparisonMode === 'split' ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* Original Image (Background) */}
                        <img
                          src={comparisonImage || image}
                          alt="Original"
                          className="max-w-full max-h-[600px] object-contain shadow-2xl"
                          crossOrigin="anonymous"
                        />
                        
                        {/* Adjusted Image (Foreground, Clipped) */}
                        <div 
                          className="absolute inset-0 overflow-hidden flex items-center justify-center"
                          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                        >
                          <img
                            src={image}
                            alt="Adjusted"
                            className="max-w-full max-h-[600px] object-contain"
                            style={{ 
                              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) grayscale(${grayscale}%) invert(${invert}%)`,
                            }}
                            crossOrigin="anonymous"
                          />
                        </div>

                        {/* Slider Handle */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                          style={{ left: `${sliderPosition}%` }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-black">
                            <Split className="w-4 h-4 rotate-90" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={image}
                        alt="Generated content"
                        className="max-w-full max-h-[600px] object-contain shadow-2xl transition-all duration-200"
                        style={{ filter: showOriginal ? 'none' : `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) grayscale(${grayscale}%) invert(${invert}%)` }}
                        crossOrigin="anonymous"
                      />
                    )}
                  </div>
                  
                  {/* Zoom Indicator */}
                  {zoom !== 1 && (
                    <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/70 text-white text-xs font-medium rounded-full backdrop-blur-sm pointer-events-none z-10 border border-white/10">
                      {Math.round(zoom * 100)}%
                    </div>
                  )}

                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    {(showAdjustments || comparisonImage) && (
                      <>
                        <button
                          onClick={() => setComparisonMode(comparisonMode === 'side-by-side' ? 'none' : 'side-by-side')}
                          className={`p-2 rounded-full shadow-lg backdrop-blur-md transition-all cursor-pointer border border-white/10 ${comparisonMode === 'side-by-side' ? 'bg-indigo-600 text-white' : 'bg-black/50 hover:bg-black/70 text-white'}`}
                          title="Side-by-Side Comparison"
                        >
                          <Grid2x2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setComparisonMode(comparisonMode === 'split' ? 'none' : 'split')}
                          className={`p-2 rounded-full shadow-lg backdrop-blur-md transition-all cursor-pointer border border-white/10 ${comparisonMode === 'split' ? 'bg-indigo-600 text-white' : 'bg-black/50 hover:bg-black/70 text-white'}`}
                          title="Split Comparison"
                        >
                          <Split className="w-5 h-5" />
                        </button>
                        {!comparisonImage && (
                          <button
                            onPointerDown={() => setShowOriginal(true)}
                            onPointerUp={() => setShowOriginal(false)}
                            onPointerLeave={() => setShowOriginal(false)}
                            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white shadow-lg backdrop-blur-md transition-all cursor-pointer border border-white/10 active:bg-indigo-600"
                            title="Hold to Compare"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        )}
                        {comparisonImage && (
                          <button
                            onClick={() => {
                              setComparisonImage(null);
                              setComparisonMode('none');
                            }}
                            className="p-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white shadow-lg backdrop-blur-md transition-all cursor-pointer border border-white/10"
                            title="Clear Comparison"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => setIsCropping(true)}
                      className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white shadow-lg backdrop-blur-md transition-all cursor-pointer border border-white/10"
                      title="Crop Image"
                    >
                      <CropIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowAdjustments(!showAdjustments)}
                      className={`p-2 rounded-full shadow-lg backdrop-blur-md transition-all cursor-pointer border border-white/10 ${showAdjustments ? 'bg-indigo-600 text-white' : 'bg-black/50 hover:bg-black/70 text-white'}`}
                      title="Adjust Colors"
                    >
                      <SlidersHorizontal className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openCollectionModal(image, prompt)}
                      className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white shadow-lg backdrop-blur-md transition-all cursor-pointer border border-white/10"
                      title="Save to Collection"
                    >
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-zinc-600 p-12">
              {loading ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-zinc-300 animate-pulse">Creating your masterpiece...</p>
                    <p className="text-sm text-zinc-500">This might take a few seconds</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-inner">
                    <ImageIcon className="w-12 h-12 opacity-20 text-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-zinc-400">Ready to Create</p>
                    <p className="text-sm text-zinc-600 max-w-xs mx-auto">Enter a prompt above and watch your imagination come to life</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        {image && !loading && (
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleCreateVariations}
              disabled={loading}
              className="group relative flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all font-medium disabled:opacity-50 shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Layers className="w-4 h-4 group-hover:scale-110 transition-transform text-indigo-400" />
              <span className="relative">Create Variations</span>
            </button>
            
            <button
              onClick={handleDownload}
              className="group relative flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all font-medium shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Download className="w-4 h-4 group-hover:scale-110 transition-transform text-emerald-400" />
              <span className="relative">Download</span>
            </button>

            <button
              onClick={handleShare}
              className="group relative flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all font-medium shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform text-blue-400" />
              <span className="relative">Share</span>
            </button>

            <button
              onClick={() => openCollectionModal(image, prompt)}
              className="group relative flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all font-medium shadow-lg hover:shadow-amber-500/10 hover:border-amber-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Bookmark className="w-4 h-4 group-hover:scale-110 transition-transform text-amber-400" />
              <span className="relative">Save</span>
            </button>
          </div>
        )}

        {showAdjustments && image && (
          <div className="p-6 bg-zinc-950/90 backdrop-blur-xl rounded-xl border border-zinc-800 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
            <h3 className="text-sm font-semibold text-zinc-200 mb-6 flex items-center gap-2 uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              Image Adjustments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {isColorizing && (
                <div className="space-y-4 md:col-span-3 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <div className="flex justify-between text-xs font-medium">
                    <label className="text-indigo-300 flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5" />
                      Color Intensity
                    </label>
                    <span className="text-indigo-300">{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    onPointerUp={commitAdjustment}
                    onKeyUp={commitAdjustment}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-medium">
                  <label className="text-zinc-400">Brightness</label>
                  <span className="text-zinc-200">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  onPointerUp={commitAdjustment}
                  onKeyUp={commitAdjustment}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-medium">
                  <label className="text-zinc-400">Contrast</label>
                  <span className="text-zinc-200">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  onPointerUp={commitAdjustment}
                  onKeyUp={commitAdjustment}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-medium">
                  <label className="text-zinc-400">Saturation</label>
                  <span className="text-zinc-200">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  onPointerUp={commitAdjustment}
                  onKeyUp={commitAdjustment}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-medium">
                  <label className="text-zinc-400">Sepia</label>
                  <span className="text-zinc-200">{sepia}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sepia}
                  onChange={(e) => setSepia(Number(e.target.value))}
                  onPointerUp={commitAdjustment}
                  onKeyUp={commitAdjustment}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-medium">
                  <label className="text-zinc-400">Grayscale</label>
                  <span className="text-zinc-200">{grayscale}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grayscale}
                  onChange={(e) => setGrayscale(Number(e.target.value))}
                  onPointerUp={commitAdjustment}
                  onKeyUp={commitAdjustment}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-500 hover:accent-zinc-400"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-medium">
                  <label className="text-zinc-400">Invert</label>
                  <span className="text-zinc-200">{invert}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={invert}
                  onChange={(e) => setInvert(Number(e.target.value))}
                  onPointerUp={commitAdjustment}
                  onKeyUp={commitAdjustment}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center border-t border-zinc-800 pt-4">
              <div className="flex gap-2">
                <button
                  onClick={undoAdjustment}
                  disabled={historyIndex === 0}
                  className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Undo"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={redoAdjustment}
                  disabled={historyIndex === adjustmentHistory.length - 1}
                  className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Redo"
                >
                  <Redo className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={resetAdjustments}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Adjustments
              </button>
            </div>
          </div>
        )}

      {variations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            Variations
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {variations.map((varImage, index) => (
              <div
                key={index}
                className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-zinc-800 bg-zinc-900 animate-in fade-in zoom-in duration-300 hover:scale-[1.02]"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => {
                  setImage(varImage);
                  resetAdjustmentHistory();
                }}
              >
                <img
                  src={varImage}
                  alt={`Variation ${index + 1}`}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setComparisonImage(varImage);
                      setComparisonMode('side-by-side');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-1.5 rounded-full bg-black/60 text-white hover:bg-indigo-600 transition-colors backdrop-blur-md border border-white/10"
                    title="Compare with current"
                  >
                    <Split className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-indigo-500" />
            History
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-zinc-800 bg-zinc-900 animate-in fade-in slide-in-from-bottom-4 duration-300 hover:scale-[1.02]"
                onClick={() => restoreHistoryItem(item)}
              >
                <img
                  src={item.image}
                  alt={item.prompt}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                  <p className="text-white text-xs text-center line-clamp-3 font-medium">
                    {item.prompt}
                  </p>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setComparisonImage(item.image);
                        setComparisonMode('side-by-side');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-1.5 rounded-full bg-black/60 text-white hover:bg-indigo-600 transition-colors backdrop-blur-md border border-white/10"
                      title="Compare with current"
                    >
                      <Split className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => deleteHistoryItem(e, item.id)}
                      className="p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors backdrop-blur-md border border-white/10"
                      title="Delete from history"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
      </div>

      {/* Face Swap Section */}
      <div className={`space-y-8 ${activeTab === 'faceswap' ? '' : 'hidden'}`}>
        <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800 p-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-white flex items-center justify-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Face Swap Studio
            </h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              Upload a target image (body/scene) and a source face to swap them seamlessly using AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Target Image Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300">Target Image (Body)</label>
                {faceSwapTarget && (
                  <button 
                    onClick={() => setFaceSwapTarget(null)}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              
              <div 
                className={`relative aspect-square rounded-xl border-2 border-dashed transition-all overflow-hidden group ${
                  faceSwapTarget 
                    ? 'border-indigo-500/30 bg-zinc-900' 
                    : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50 bg-zinc-900/50'
                }`}
              >
                {faceSwapTarget ? (
                  <img 
                    src={faceSwapTarget} 
                    alt="Target" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                    <div className="p-4 rounded-full bg-zinc-800/50 mb-3 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-6 h-6 text-zinc-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300">Upload Target Image</span>
                    <span className="text-xs text-zinc-500 mt-1">The scene/body to use</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleTargetUpload} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Source Face Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300">Source Face</label>
                {faceSwapSource && (
                  <button 
                    onClick={() => setFaceSwapSource(null)}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              
              <div 
                className={`relative aspect-square rounded-xl border-2 border-dashed transition-all overflow-hidden group ${
                  faceSwapSource 
                    ? 'border-indigo-500/30 bg-zinc-900' 
                    : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50 bg-zinc-900/50'
                }`}
              >
                {faceSwapSource ? (
                  <img 
                    src={faceSwapSource} 
                    alt="Source" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                    <div className="p-4 rounded-full bg-zinc-800/50 mb-3 group-hover:scale-110 transition-transform">
                      <User className="w-6 h-6 text-zinc-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300">Upload Source Face</span>
                    <span className="text-xs text-zinc-500 mt-1">The face to swap in</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleSourceUpload} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            {/* Facial Feature Customization */}
            <div className="w-full max-w-2xl space-y-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Customize Facial Features (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Dropdown
                  label="Eye Color"
                  placeholder="Original Eye Color"
                  value={faceSwapEyeColor}
                  options={facialFeatures.eyeColor}
                  onChange={(val) => setFaceSwapEyeColor(val)}
                />
                <Dropdown
                  label="Hair Color"
                  placeholder="Original Hair Color"
                  value={faceSwapHairColor}
                  options={facialFeatures.hairColor}
                  onChange={(val) => setFaceSwapHairColor(val)}
                />
                <Dropdown
                  label="Skin Tone"
                  placeholder="Original Skin Tone"
                  value={faceSwapSkinTone}
                  options={facialFeatures.skinTone}
                  onChange={(val) => setFaceSwapSkinTone(val)}
                />
                <Dropdown
                  label="Expression"
                  placeholder="Original Expression"
                  value={faceSwapExpression}
                  options={facialFeatures.expression}
                  onChange={(val) => setFaceSwapExpression(val)}
                />
              </div>
            </div>

            {/* Style Reference for Face Swap */}
            <div className="w-full max-w-2xl space-y-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-center gap-2">
                <Paintbrush className="w-3.5 h-3.5" />
                Style Reference (Optional)
              </label>
              
              {!faceSwapStyleImage ? (
                <div className="flex justify-center">
                  <label className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium cursor-pointer w-full sm:w-auto">
                    <ImageIcon className="w-4 h-4" />
                    Upload Style Reference
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFaceSwapStyleImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="relative w-full max-w-xs mx-auto">
                  <img
                    src={faceSwapStyleImage}
                    alt="Style Reference"
                    className="w-full h-32 object-cover rounded-xl border border-zinc-800 shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFaceSwapStyleImage(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-red-500/90 transition-all cursor-pointer border border-white/10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Masking Options */}
            <div className="flex flex-col items-center gap-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Masking Mode
              </label>
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                {(['full', 'internal', 'eyes', 'mouth'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFaceSwapMaskingMode(mode)}
                    className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                      faceSwapMaskingMode === mode
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 max-w-xs text-center h-4 animate-in fade-in duration-300">
                {faceSwapMaskingMode === 'full' && 'Swap entire face including jawline'}
                {faceSwapMaskingMode === 'internal' && 'Swap eyes, nose, and mouth only'}
                {faceSwapMaskingMode === 'eyes' && 'Swap eyes only'}
                {faceSwapMaskingMode === 'mouth' && 'Swap mouth/lips only'}
              </p>
            </div>

            {/* Fidelity Options */}
            <div className="flex flex-col items-center gap-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Fidelity Mode
              </label>
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                {(['standard', 'high', 'artistic'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFaceSwapFidelity(mode)}
                    className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                      faceSwapFidelity === mode
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 max-w-xs text-center h-4 animate-in fade-in duration-300">
                {faceSwapFidelity === 'standard' && 'Balanced realism and blending'}
                {faceSwapFidelity === 'high' && 'Hyper-realistic blending and texture matching'}
                {faceSwapFidelity === 'artistic' && 'Creative interpretation of lighting and mood'}
              </p>
            </div>

            <button
              onClick={handleFaceSwap}
              disabled={!faceSwapTarget || !faceSwapSource || isSwapping}
              className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2"
            >
              {isSwapping ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Swapping Faces...
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5" />
                  Swap Faces
                </>
              )}
            </button>
          </div>

          {/* Result Section */}
          {swappedImage && (
            <div className="mt-8 pt-8 border-t border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Result
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = swappedImage;
                      link.download = `face-swap-${Date.now()}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="relative rounded-xl overflow-hidden border border-zinc-700 shadow-2xl bg-zinc-950">
                <img 
                  src={swappedImage} 
                  alt="Swapped Result" 
                  className="w-full h-auto" 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collections Section */}
      {activeTab === 'collections' && (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Collections</h2>
          <button
            onClick={() => setShowCollectionModal(true)}
            className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>
        
        {collections.length === 0 ? (
          <div className="text-center p-8 md:p-12 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
            <Folder className="w-12 h-12 mx-auto text-zinc-700 mb-3" />
            <p className="text-zinc-500">No collections yet. Create one to organize your images.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {collections.map((collection) => (
              <div 
                key={collection.id}
                className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 hover:border-zinc-700 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => setViewingCollection(collection)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Folder className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-medium text-white">{collection.name}</h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCollection(collection.id);
                    }}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {collection.images.slice(0, 2).map((img) => (
                    <img 
                      key={img.id} 
                      src={img.url} 
                      className="w-full h-20 object-cover rounded-lg bg-zinc-800" 
                      alt="" 
                    />
                  ))}
                  {collection.images.length === 0 && (
                     <div className="col-span-2 h-20 bg-zinc-800/50 rounded-lg flex items-center justify-center text-xs text-zinc-600">
                       Empty
                     </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  {collection.images.length} items
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200 border border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {selectedImageForCollection ? 'Save to Collection' : 'Manage Collections'}
              </h3>
              <button 
                onClick={() => {
                  setShowCollectionModal(false);
                  setSelectedImageForCollection(null);
                }}
                className="p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="New collection name..."
                className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-white placeholder-zinc-600"
              />
              <button
                onClick={createCollection}
                disabled={!newCollectionName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Create
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => selectedImageForCollection ? addToCollection(col.id) : null}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedImageForCollection
                      ? 'hover:border-indigo-500/50 hover:bg-indigo-900/10 cursor-pointer border-zinc-800'
                      : 'border-zinc-800 cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">{col.name}</p>
                      <p className="text-xs text-zinc-500">{col.images.length} items</p>
                    </div>
                  </div>
                  {selectedImageForCollection && (
                    <Plus className="w-5 h-5 text-zinc-600" />
                  )}
                </button>
              ))}
              {collections.length === 0 && (
                <p className="text-center text-zinc-600 py-8 text-sm">No collections found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Collection Modal */}
      {viewingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border border-zinc-800">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Folder className="w-6 h-6 text-indigo-500" />
                <h3 className="text-2xl font-bold text-white">
                  {viewingCollection.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 text-xs font-medium text-zinc-400 border border-zinc-800">
                  {viewingCollection.images.length}
                </span>
              </div>
              <button 
                onClick={() => setViewingCollection(null)}
                className="p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {viewingCollection.images.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 mx-auto text-zinc-800 mb-4" />
                  <p className="text-zinc-500 text-lg">This collection is empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {viewingCollection.images.map((img) => (
                    <div key={img.id} className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all bg-zinc-900 border border-zinc-800">
                      <img 
                        src={img.url} 
                        alt={img.prompt}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 backdrop-blur-sm">
                        <div className="flex justify-end">
                          <button
                            onClick={() => removeFromCollection(viewingCollection.id, img.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-full transition-colors border border-red-500/20"
                            title="Remove from collection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          <p className="text-zinc-300 text-xs line-clamp-2 font-medium">{img.prompt}</p>
                          <button
                            onClick={() => {
                              setPrompt(img.prompt);
                              setViewingCollection(null);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-medium transition-colors border border-white/10"
                          >
                            Use Prompt
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
