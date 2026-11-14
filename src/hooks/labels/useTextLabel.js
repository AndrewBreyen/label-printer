import { useCallback, useEffect, useRef, useState } from 'react';
import {
  drawRotatedCanvas,
  PX_PER_MM,
  TAPE_WIDTH_PX,
} from '../../utils/barcodeUtils';
import { MIN_LENGTH_MM } from '../../utils/labelTemplates';
import { generateTextCanvas } from '../../utils/textLabelUtils';

export default function useTextLabel({
  mode,
  labelWidth,
  fontFamily,
  fontScale,
  marginMm,
}) {
  const [value, setValue] = useState('# Hello World');
  const [error, setError] = useState('');
  const [lengthMm, setLengthMm] = useState(null);
  const [orientation, setOrientation] = useState('rotated');
  const [minimumLengthMm, setMinimumLengthMm] = useState(MIN_LENGTH_MM);
  const [alignment, setAlignment] = useState('start');
  const printCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const drawLabel = useCallback(() => {
    const printCanvas = printCanvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!printCanvas || !previewCanvas) return;

    setError('');
    setLengthMm(null);
    printCanvas.width = labelWidth;
    printCanvas.height = 1;
    previewCanvas.width = TAPE_WIDTH_PX;
    previewCanvas.height = 1;

    if (!value.trim()) {
      previewCanvas.height = Math.max(1, Math.round(minimumLengthMm * PX_PER_MM));
      const context = previewCanvas.getContext('2d');
      if (!context) throw new Error('Could not create the text label preview canvas.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      return;
    }

    const textCanvas = generateTextCanvas(value, {
      orientation,
      minimumLengthMm,
      alignment,
      fontFamily,
      fontScale,
      marginMm,
    });
    const rotated = orientation === 'rotated';
    const printLength = rotated ? textCanvas.width : textCanvas.height;
    setLengthMm(printLength / PX_PER_MM);

    printCanvas.width = labelWidth;
    printCanvas.height = printLength;
    const printContext = printCanvas.getContext('2d');
    if (!printContext) throw new Error('Could not create the text label print canvas.');
    printContext.fillStyle = '#ffffff';
    printContext.fillRect(0, 0, printCanvas.width, printCanvas.height);

    if (rotated) {
      printContext.save();
      printContext.translate(labelWidth - TAPE_WIDTH_PX, 0);
      drawRotatedCanvas(printContext, textCanvas);
      printContext.restore();
    } else {
      printContext.drawImage(textCanvas, labelWidth - TAPE_WIDTH_PX, 0);
    }

    previewCanvas.width = TAPE_WIDTH_PX;
    previewCanvas.height = printLength;
    const previewContext = previewCanvas.getContext('2d');
    if (!previewContext) throw new Error('Could not create the text label preview canvas.');
    previewContext.fillStyle = '#ffffff';
    previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (rotated) drawRotatedCanvas(previewContext, textCanvas);
    else previewContext.drawImage(textCanvas, 0, 0);
  }, [
    value,
    labelWidth,
    orientation,
    minimumLengthMm,
    alignment,
    fontFamily,
    fontScale,
    marginMm,
  ]);

  useEffect(() => {
    if (mode !== 'text') return;
    try {
      drawLabel();
    } catch (drawError) {
      setError(drawError.message);
    }
  }, [mode, drawLabel]);

  return {
    value,
    setValue,
    error,
    lengthMm,
    orientation,
    setOrientation,
    minimumLengthMm,
    setMinimumLengthMm,
    alignment,
    setAlignment,
    printCanvasRef,
    previewCanvasRef,
    drawLabel,
  };
}
