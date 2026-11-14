import { useCallback, useEffect, useRef, useState } from 'react';
import { ditherImageData } from '../../utils/imageUtils';
import { PX_PER_MM } from '../../utils/labelTemplates';

export default function useImageLabel({ mode, labelWidth }) {
  const [file, setFile] = useState(null);
  const [height, setHeight] = useState(1);
  const [lightenAmount, setLightenAmount] = useState(80);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const imageRef = useRef(null);
  const printCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const selectFile = (nextFile) => {
    setError('');
    setLoaded(false);
    setFile(nextFile);
  };

  useEffect(() => {
    if (!file) {
      imageRef.current = null;
      setHeight(1);
      setLoaded(false);
      setError('');
      return undefined;
    }

    setLoaded(false);
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    let cancelled = false;

    image.onload = () => {
      if (cancelled) return;
      if (!image.naturalWidth || !image.naturalHeight) {
        setError('The selected image has invalid dimensions.');
        return;
      }

      imageRef.current = image;
      setHeight(Math.max(1, Math.round((image.naturalHeight * labelWidth) / image.naturalWidth)));
      setLoaded(true);
      setError('');
    };

    image.onerror = () => {
      if (cancelled) return;
      imageRef.current = null;
      setLoaded(false);
      setError('Could not load the selected image.');
    };

    image.src = objectUrl;

    return () => {
      cancelled = true;
      imageRef.current = null;
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, labelWidth]);

  const drawLabel = useCallback(() => {
    const image = imageRef.current;
    const canvases = [printCanvasRef.current, previewCanvasRef.current];
    if (!image || canvases.some((canvas) => !canvas)) return;

    canvases.forEach((canvas) => {
      canvas.width = labelWidth;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not create the image print canvas.');

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, labelWidth, height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      context.putImageData(ditherImageData(imageData, lightenAmount), 0, 0);
    });
  }, [height, labelWidth, lightenAmount]);

  useEffect(() => {
    if (mode === 'image' && imageRef.current) drawLabel();
  }, [mode, height, loaded, drawLabel]);

  return {
    file,
    height,
    heightMm: height / PX_PER_MM,
    lightenAmount,
    setLightenAmount,
    loaded,
    error,
    selectFile,
    imageRef,
    printCanvasRef,
    previewCanvasRef,
    drawLabel,
  };
}
