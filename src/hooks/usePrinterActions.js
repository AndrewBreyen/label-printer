import { useState } from 'react';
import {
  connectPrinter,
  disconnectPrinter,
  isPrinterConnected,
  printLabel,
} from '../services/printerService';
import { CONTINUOUS_PAPER_TYPE } from '../utils/barcodeUtils';

export default function usePrinterActions({
  mode,
  isReceiptMode,
  drawLabel,
  drawBarcode,
  drawText,
  drawImageLabel,
  barcodeValue,
  barcodeError,
  textValue,
  imageLoaded,
  imageRef,
  canvasRefs,
  setShowRuler,
  setStatus,
}) {
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    setStatus('');
    setBusy(true);
    try {
      await connectPrinter();
      setConnected(true);
      setStatus('Printer connected.');
    } catch (err) {
      setStatus(`Connection failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await disconnectPrinter();
      setConnected(false);
      setStatus('Printer disconnected.');
    } catch (err) {
      setStatus(`Disconnect failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = async () => {
    if (!isPrinterConnected()) {
      setStatus('Connect the printer first.');
      return;
    }
    setBusy(true);
    setStatus('Printing...');
    try {
      drawLabel();
      await printLabel(
        canvasRefs.label.current,
        isReceiptMode ? { paperType: CONTINUOUS_PAPER_TYPE } : undefined
      );
      setStatus('Label sent to printer.');
    } catch (err) {
      setStatus(`Print failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePrintBarcode = async () => {
    if (!isPrinterConnected()) {
      setStatus('Connect the printer first.');
      return;
    }
    if (!barcodeValue.trim()) {
      setStatus('Enter a value to encode first.');
      return;
    }
    setBusy(true);
    setStatus('Printing...');
    try {
      drawBarcode();
      if (barcodeError) throw new Error(barcodeError);
      await printLabel(canvasRefs.barcode.current, { paperType: CONTINUOUS_PAPER_TYPE });
      setStatus('Label sent to printer.');
    } catch (err) {
      setStatus(`Print failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePrintText = async () => {
    if (!isPrinterConnected()) {
      setStatus('Connect the printer first.');
      return;
    }
    if (!textValue.trim()) {
      setStatus('Enter text to print first.');
      return;
    }
    setBusy(true);
    setStatus('Printing...');
    try {
      drawText();
      await printLabel(canvasRefs.text.current, { paperType: CONTINUOUS_PAPER_TYPE });
      setStatus('Label sent to printer.');
    } catch (err) {
      setStatus(`Print failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePrintImage = async () => {
    if (!isPrinterConnected()) {
      setStatus('Connect the printer first.');
      return;
    }
    if (!imageRef.current) {
      setStatus('Choose an image to print first.');
      return;
    }
    setBusy(true);
    setStatus('Printing...');
    try {
      drawImageLabel();
      await printLabel(canvasRefs.image.current, { paperType: CONTINUOUS_PAPER_TYPE });
      setStatus('Image sent to printer.');
    } catch (err) {
      setStatus(`Print failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePrintRuler = async () => {
    if (!isPrinterConnected()) {
      setStatus('Connect the printer first.');
      return;
    }
    setShowRuler(true);
    await new Promise((resolve) => setTimeout(resolve, 50));
    setBusy(true);
    setStatus('Printing ruler...');
    try {
      await printLabel(canvasRefs.ruler.current);
      setStatus("Ruler printed — find the tick number at your label's physical edge.");
    } catch (err) {
      setStatus(`Ruler print failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const onPrint =
    mode === 'barcode'
      ? handlePrintBarcode
      : mode === 'text'
        ? handlePrintText
        : mode === 'image'
          ? handlePrintImage
          : handlePrint;
  const printDisabled =
    busy ||
    !connected ||
    (mode === 'barcode' && !barcodeValue.trim()) ||
    (mode === 'text' && !textValue.trim()) ||
    (mode === 'image' && !imageLoaded);

  return {
    connected,
    busy,
    printDisabled,
    onPrint,
    handleConnect,
    handleDisconnect,
    handlePrintRuler,
  };
}
