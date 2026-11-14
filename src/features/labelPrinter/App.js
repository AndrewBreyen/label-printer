import React, { useState } from 'react';
import { isNativeIOS, REQUIRED_IMAGE_WIDTH } from '../../services/printerService';
import { LABEL_TEMPLATES, DEFAULT_TEMPLATE_NAME } from '../../utils/labelTemplates';
import { getMarkdownContentHeight } from '../../utils/markdown';
import { PX_PER_MM } from '../../utils/barcodeUtils';
import { MODE_STOCK_GROUP, STOCK_GROUPS } from '../../config/appConfig';
import StockNavigation from '../../components/navigation/StockNavigation';
import EditorPanel from '../../components/editor/EditorPanel';
import LabelPreview from '../../components/preview/LabelPreview';
import PreviewCanvas from '../../components/preview/PreviewCanvas';
import PrinterConnection from '../../components/actions/PrinterConnection';
import PrintTestButton from '../../components/actions/PrintTestButton';
import useLabelEditor from './useLabelEditor';
import useLabelPrinting from './useLabelPrinting';
import '../../styles/App.css';

const LABEL_WIDTH = REQUIRED_IMAGE_WIDTH;

export default function App() {
  const [mode, setMode] = useState('manual');
  const [stockGroup, setStockGroup] = useState('small');
  const [preferredModes, setPreferredModes] = useState({
    small: 'manual',
    receipt58: 'receipt',
    continuous15: 'text',
  });
  const [templateName, setTemplateName] = useState(DEFAULT_TEMPLATE_NAME);
  const [status, setStatus] = useState('');
  const isReceiptMode = mode === 'receipt';
  const template = LABEL_TEMPLATES[templateName];
  const editorState = useLabelEditor({
    mode,
    isReceiptMode,
    templateName,
    setTemplateName,
    setStatus,
  });
  const { markdownContent, fontFamily, fontScale, marginMm } = editorState;
  const marginPx = marginMm * PX_PER_MM;
  const contentWidth = isReceiptMode ? LABEL_WIDTH : template.width;
  const contentLeft = isReceiptMode ? 0 : LABEL_WIDTH - contentWidth;
  const contentHeight = isReceiptMode
    ? getMarkdownContentHeight(markdownContent, contentWidth, fontFamily, fontScale, marginPx) + 32
    : template.contentHeight;
  const feedHeight = isReceiptMode ? contentHeight : template.feedHeight;
  const printing = useLabelPrinting({
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
  });
  const { printer, preview, canvases, showRuler } = printing;
  const activeMode = STOCK_GROUPS.find((group) => group.id === stockGroup)?.modes.find(
    (option) => option.id === mode
  );
  const printCanvases = [
    ['label', canvases.labelRef, feedHeight],
    ['barcode', canvases.barcodeRef, 1],
    ['text', canvases.textRef, 1],
    ['image', canvases.imageRef, 1],
  ];

  const handleModeSelect = (nextMode) => {
    const nextGroup = MODE_STOCK_GROUP[nextMode];
    setMode(nextMode);
    setStockGroup(nextGroup);
    setPreferredModes((previous) => ({ ...previous, [nextGroup]: nextMode }));
  };

  const handleStockGroupSelect = (nextGroup) => {
    setStockGroup(nextGroup);
    setMode(preferredModes[nextGroup]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">MARKLIFE P50S</p>
          <h1>Label Printer</h1>
        </div>
      </header>

      <PrinterConnection
        connected={printer.connected}
        busy={printer.busy}
        onConnect={printer.handleConnect}
        onDisconnect={printer.handleDisconnect}
      />

      <StockNavigation
        stockGroup={stockGroup}
        mode={mode}
        onSelectStockGroup={handleStockGroupSelect}
        onSelectMode={handleModeSelect}
      />

      <main className="workspace">
        <EditorPanel
          {...editorState.editor}
          mode={mode}
          stockGroup={stockGroup}
          activeMode={activeMode}
          isReceiptMode={isReceiptMode}
          image={printing.editor.image}
          barcode={printing.editor.barcode}
          text={printing.editor.text}
        />
        <LabelPreview
          mode={mode}
          stockGroup={stockGroup}
          barcodeLengthMm={preview.barcodeLengthMm}
          textLengthMm={preview.textLengthMm}
          preview={
            <PreviewCanvas
              mode={mode}
              imageLoaded={preview.imageLoaded}
              imageHeight={preview.imageHeight}
              labelWidth={LABEL_WIDTH}
              tapeWidth={preview.tapeWidth}
              contentWidth={contentWidth}
              contentHeight={contentHeight}
              imageRef={preview.imageRef}
              barcodeRef={preview.barcodeRef}
              textRef={preview.textRef}
              labelRef={preview.labelRef}
            />
          }
          showRuler={showRuler}
          rulerCanvasRef={preview.rulerCanvasRef}
          labelWidth={LABEL_WIDTH}
          feedHeight={feedHeight}
        />
      </main>

      {printCanvases.map(([key, ref, height]) => (
        <canvas
          key={key}
          ref={ref}
          width={LABEL_WIDTH}
          height={height}
          style={{ display: 'none' }}
        />
      ))}

      <footer className="app-footer">
        {!isNativeIOS && (
          <span>Web printing requires Chrome or Edge over HTTPS (or localhost).</span>
        )}
        <PrintTestButton
          connected={printer.connected}
          busy={printer.busy}
          onClick={printer.handlePrintRuler}
        />
      </footer>
      <div className="floating-print">
        {status && <p className="status-message" role="status">{status}</p>}
        <button
          type="button"
          className="button button--primary"
          onClick={printer.onPrint}
          disabled={printer.printDisabled}
        >
          Print Label
        </button>
      </div>
    </div>
  );
}
