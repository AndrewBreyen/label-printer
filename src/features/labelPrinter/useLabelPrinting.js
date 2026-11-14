import { useState } from 'react';
import { REQUIRED_IMAGE_WIDTH } from '../../services/printerService';
import { TAPE_WIDTH_PX } from '../../utils/barcodeUtils';
import usePrinterActions from '../../hooks/usePrinterActions';
import useBarcodeLabel from '../../hooks/labels/useBarcodeLabel';
import useImageLabel from '../../hooks/labels/useImageLabel';
import useMarkdownLabel from '../../hooks/labels/useMarkdownLabel';
import useTextLabel from '../../hooks/labels/useTextLabel';

const LABEL_WIDTH = REQUIRED_IMAGE_WIDTH;

export default function useLabelPrinting({
  mode,
  isReceiptMode,
  markdownContent,
  contentWidth,
  contentLeft,
  contentHeight,
  feedHeight,
  fontFamily,
  fontScale,
  marginMm,
  marginPx,
  setStatus,
}) {
  const [showRuler, setShowRuler] = useState(false);
  const image = useImageLabel({ mode, labelWidth: LABEL_WIDTH });
  const barcode = useBarcodeLabel({ mode, labelWidth: LABEL_WIDTH });
  const text = useTextLabel({
    mode,
    labelWidth: LABEL_WIDTH,
    fontFamily,
    fontScale,
    marginMm,
  });
  const markdownCanvases = useMarkdownLabel({
    markdown: markdownContent,
    labelWidth: LABEL_WIDTH,
    contentWidth,
    contentLeft,
    contentHeight,
    feedHeight,
    fontFamily,
    fontScale,
    marginPx,
    showRuler,
  });
  const printer = usePrinterActions({
    mode,
    isReceiptMode,
    drawLabel: markdownCanvases.drawLabel,
    drawBarcode: barcode.drawLabel,
    drawText: text.drawLabel,
    drawImageLabel: image.drawLabel,
    barcodeValue: barcode.value,
    barcodeError: barcode.error,
    textValue: text.value,
    imageLoaded: image.loaded,
    imageRef: image.imageRef,
    canvasRefs: {
      label: markdownCanvases.printCanvasRef,
      barcode: barcode.printCanvasRef,
      text: text.printCanvasRef,
      image: image.printCanvasRef,
      ruler: markdownCanvases.rulerCanvasRef,
    },
    setShowRuler,
    setStatus,
  });

  return {
    printer,
    showRuler,
    preview: {
      barcodeLengthMm: barcode.lengthMm,
      textLengthMm: text.lengthMm,
      imageLoaded: image.loaded,
      imageHeight: image.height,
      tapeWidth: TAPE_WIDTH_PX,
      imageRef: image.previewCanvasRef,
      barcodeRef: barcode.previewCanvasRef,
      textRef: text.previewCanvasRef,
      labelRef: markdownCanvases.previewCanvasRef,
      rulerCanvasRef: markdownCanvases.rulerCanvasRef,
    },
    editor: {
      image: {
        error: image.error,
        loaded: image.loaded,
        lightenAmount: image.lightenAmount,
        setLightenAmount: image.setLightenAmount,
        heightMm: image.heightMm,
        onSelectFile: image.selectFile,
      },
      barcode: {
        value: barcode.value,
        setValue: barcode.setValue,
        error: barcode.error,
      },
      text: {
        value: text.value,
        setValue: text.setValue,
        error: text.error,
        orientation: text.orientation,
        setOrientation: text.setOrientation,
        minimumLengthMm: text.minimumLengthMm,
        setMinimumLengthMm: text.setMinimumLengthMm,
        alignment: text.alignment,
        setAlignment: text.setAlignment,
      },
    },
    canvases: {
      labelRef: markdownCanvases.printCanvasRef,
      barcodeRef: barcode.printCanvasRef,
      textRef: text.printCanvasRef,
      imageRef: image.printCanvasRef,
    },
  };
}
