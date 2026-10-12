import { useState, useCallback, RefObject } from 'react';
import { toPng } from 'html-to-image';

// Renders a DOM card to a PNG and offers download / copy. Shared by ShareCard and InitiationCertificate.
export const useCardImage = (cardRef: RefObject<HTMLDivElement | null>) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      // Small pause to let fonts and responsive elements finish layout calculations
      await new Promise(r => setTimeout(r, 150));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        // Prevent massive canvas height on iOS/older devices by scaling pixel ratio down if the card is gigantic
        pixelRatio: cardRef.current.offsetHeight > 2000 ? 1 : 2,
        style: { margin: '0' } // Clear any margin affecting the export
      });
      setGeneratedImage(dataUrl);
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [cardRef]);

  const download = (filename: string) => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = generatedImage;
    link.click();
  };

  const copyToClipboard = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      // Brief visual feedback
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return { isGenerating, generatedImage, setGeneratedImage, isCopied, generateImage, download, copyToClipboard };
};
