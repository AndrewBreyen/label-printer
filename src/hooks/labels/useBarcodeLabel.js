import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BARCODE_HEIGHT_PX,
  BARCODE_SIDE_MARGIN_PX,
  drawRotatedBarcode,
  generateBarcodeCanvas,
  PX_PER_MM,
  TAPE_WIDTH_PX,
} from '../../utils/barcodeUtils';
import { MAX_CONTINUOUS_LENGTH_MM, MIN_LENGTH_MM } from '../../utils/labelTemplates';

function clearCanvas(canvas, width) {
  canvas.width = width;
  canvas.height = 1;
}

export default function useBarcodeLabel({ mode, labelWidth, minimumLengthMm }) {
  const [value, setValue] = useState('412  0115711#$578=@;<');
  const [error, setError] = useState('');
  const [lengthMm, setLengthMm] = useState(null);
  const printCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const drawLabel = useCallback(() => {
    const printCanvas = printCanvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!printCanvas || !previewCanvas) return;

    setError('');
    setLengthMm(null);
    const barcodeValue = value.trim();

    if (!barcodeValue) {
      clearCanvas(printCanvas, labelWidth);
      clearCanvas(previewCanvas, TAPE_WIDTH_PX);
      return;
    }

    if (
      minimumLengthMm !== null &&
      (!Number.isFinite(minimumLengthMm) ||
        minimumLengthMm < MIN_LENGTH_MM ||
        minimumLengthMm > MAX_CONTINUOUS_LENGTH_MM)
    ) {
      setError(
        `Minimum label length must be between ${MIN_LENGTH_MM} and ${MAX_CONTINUOUS_LENGTH_MM} mm.`
      );
      clearCanvas(printCanvas, labelWidth);
      clearCanvas(previewCanvas, TAPE_WIDTH_PX);
      return;
    }

    let barcode;
    try {
      barcode = generateBarcodeCanvas(barcodeValue, BARCODE_HEIGHT_PX);
    } catch (drawError) {
      setError(drawError.message);
      clearCanvas(printCanvas, labelWidth);
      clearCanvas(previewCanvas, TAPE_WIDTH_PX);
      return;
    }

    const printLength = Math.max(
      barcode.width,
      Math.ceil((minimumLengthMm ?? 0) * PX_PER_MM)
    );
    setLengthMm(printLength / PX_PER_MM);

    printCanvas.width = labelWidth;
    printCanvas.height = printLength;
    const printContext = printCanvas.getContext('2d');
    printContext.fillStyle = '#ffffff';
    printContext.fillRect(0, 0, printCanvas.width, printCanvas.height);
    printContext.save();
    printContext.translate(labelWidth - TAPE_WIDTH_PX + BARCODE_SIDE_MARGIN_PX, 0);
    drawRotatedBarcode(printContext, barcode);
    printContext.restore();

    previewCanvas.width = TAPE_WIDTH_PX;
    previewCanvas.height = printLength;
    const previewContext = previewCanvas.getContext('2d');
    previewContext.fillStyle = '#ffffff';
    previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewContext.translate(BARCODE_SIDE_MARGIN_PX, 0);
    drawRotatedBarcode(previewContext, barcode);
  }, [labelWidth, minimumLengthMm, value]);

  useEffect(() => {
    if (mode === 'barcode') drawLabel();
  }, [mode, drawLabel]);

  return {
    value,
    setValue,
    error,
    lengthMm,
    printCanvasRef,
    previewCanvasRef,
    drawLabel,
  };
}
