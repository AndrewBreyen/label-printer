import React, { useState, useRef, useEffect, useCallback } from 'react';
import { REQUIRED_IMAGE_WIDTH } from '../../services/printerService';
import { drawRulerTicks } from '../../utils/rulerUtils';
import { LABEL_TEMPLATES, DEFAULT_TEMPLATE_NAME } from '../../utils/labelTemplates';
import { useContentTemplates } from '../../hooks/useContentTemplates';
import { MARKDOWN_TEMPLATES } from '../../utils/markdownTemplates';
import { getMarkdownContentHeight, renderMarkdownContent } from '../../utils/markdown';
import {
  generateBarcodeCanvas,
  drawRotatedBarcode,
  drawRotatedCanvas,
  TAPE_WIDTH_PX,
  PX_PER_MM as BARCODE_PX_PER_MM,
  BARCODE_SIDE_MARGIN_PX,
  BARCODE_HEIGHT_PX,
} from '../../utils/barcodeUtils';
import { generateTextCanvas } from '../../utils/textLabelUtils';
import { ditherImageData } from '../../utils/imageUtils';
import {
  DEFAULT_MARGIN_MM,
  FONT_OPTIONS,
  MAX_MARGIN_MM,
  MODE_STOCK_GROUP,
  STOCK_GROUPS,
  TEXT_SIZE_SCALES,
} from '../../config/appConfig';
import StockNavigation from '../../components/navigation/StockNavigation';
import EditorPanel from '../../components/editor/EditorPanel';
import LabelPreview from '../../components/preview/LabelPreview';
import PrintActions from '../../components/actions/PrintActions';
import PrintTestButton from '../../components/actions/PrintTestButton';
import usePrinterActions from '../../hooks/usePrinterActions';
import '../../styles/App.css';

// Canvas width MUST equal REQUIRED_IMAGE_WIDTH (384px) — this is a
// firmware requirement, not something that varies per label size.
const LABEL_WIDTH = REQUIRED_IMAGE_WIDTH;

function App() {
  const DEFAULT_MARKDOWN = '# Hello World';
  const [markdownContent, setMarkdownContent] = useState(DEFAULT_MARKDOWN);
  const [mode, setMode] = useState('manual');
  const [stockGroup, setStockGroup] = useState('small');
  const [preferredModes, setPreferredModes] = useState({
    small: 'manual',
    receipt58: 'receipt',
    continuous15: 'text',
  });
  const [templateName, setTemplateName] = useState(DEFAULT_TEMPLATE_NAME);
  const template = LABEL_TEMPLATES[templateName];
  const isReceiptMode = mode === 'receipt';
  const [fontFamilyOverride, setFontFamilyOverride] = useState(null);
  const [textSize, setTextSize] = useState('standard');
  const [marginMm, setMarginMm] = useState(DEFAULT_MARGIN_MM);
  const fontFamily = fontFamilyOverride ?? (isReceiptMode ? 'monospace' : 'sans-serif');
  const fontScale = TEXT_SIZE_SCALES[textSize];
  const marginPx = marginMm * BARCODE_PX_PER_MM;
  const CONTENT_WIDTH = isReceiptMode ? LABEL_WIDTH : template.width;
  const CONTENT_LEFT = isReceiptMode ? 0 : LABEL_WIDTH - CONTENT_WIDTH;
  const contentHeight = isReceiptMode
    ? getMarkdownContentHeight(markdownContent, CONTENT_WIDTH, fontFamily, fontScale, marginPx) + 32
    : template.contentHeight; // visible content box — what the cropped preview shows
  const feedHeight = isReceiptMode ? contentHeight : template.feedHeight;
  const [status, setStatus] = useState('');

  // Manual vs Templates vs Prep Label vs Barcode mode, and the saved
  // content presets used by Templates mode.
  const { templates: contentTemplates, saveTemplate, deleteTemplate } = useContentTemplates();
  const [selectedContentTemplate, setSelectedContentTemplate] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');

  const applyContentTemplate = (name) => {
    const t = contentTemplates.find((tpl) => tpl.name === name);
    if (!t) return;
    setSelectedContentTemplate(name);
    setMarkdownContent(t.markdown);
    setFontFamilyOverride(
      FONT_OPTIONS.some((option) => option.value === t.fontFamily) ? t.fontFamily : null
    );
    setTextSize(Object.hasOwn(TEXT_SIZE_SCALES, t.textSize) ? t.textSize : 'standard');
    setMarginMm(
      Number.isFinite(t.marginMm) && t.marginMm >= 0 && t.marginMm <= MAX_MARGIN_MM
        ? t.marginMm
        : DEFAULT_MARGIN_MM
    );
  };

  const handleSaveTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) return;
    saveTemplate(name, { markdown: markdownContent, fontFamily, textSize, marginMm });
    setSelectedCodeTemplate('');
    setSelectedContentTemplate(name);
    setNewTemplateName('');
    setStatus(`Saved template "${name}".`);
  };

  const [selectedCodeTemplate, setSelectedCodeTemplate] = useState('');

  const applyCodeTemplate = (name) => {
    const t = MARKDOWN_TEMPLATES[name];
    if (!t) return;
    setSelectedCodeTemplate(name);
    setSelectedContentTemplate('');
    setMarkdownContent(t.markdown);
  };

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

  const handleTemplateSelect = (value) => {
    if (!value) {
      setSelectedCodeTemplate('');
      setSelectedContentTemplate('');
    } else if (value.startsWith('code:')) {
      applyCodeTemplate(value.slice('code:'.length));
    } else if (value.startsWith('saved:')) {
      applyContentTemplate(value.slice('saved:'.length));
      setSelectedCodeTemplate('');
    }
  };

  // Prep Label mode: item name + a date-only picker for "USE BY".
  // PREP always shows the live current date/time ({{now}}); USE BY
  // combines the picked date with the current time-of-day
  // ({{nowtime}}) — the date is fixed by your selection, the time
  // portion stays live just like PREP's does.
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const [prepItemName, setPrepItemName] = useState('');
  const [prepUseByDate, setPrepUseByDate] = useState(todayISO());

  useEffect(() => {
    if (mode !== 'prep') return;
    // Parse as local time (not UTC) so the picked date doesn't shift
    // a day depending on timezone.
    const [y, m, d] = prepUseByDate.split('-').map(Number);
    const useByLabel =
      y && m && d
        ? new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
        : '';
    const name = prepItemName.trim() || 'Item';
    setMarkdownContent(
      `# ${name}\n\nPREP\n## {{now}}\n\nUSE BY\n## ${useByLabel} {{nowtime}}`
    );
  }, [mode, prepItemName, prepUseByDate]);

  // Barcode mode: a single value to encode as CODE128, printed
  // rotated 90° so it fills the full 15mm width of continuous tape
  // (see barcodeUtils.js). Unlike the markdown modes, the print
  // length here isn't fixed by a label template — it's however long
  // the encoded bar sequence needs to be, which is exactly how
  // continuous roll stock is meant to be used.
  const [barcodeValue, setBarcodeValue] = useState('412  0115711#$578=@;<');
  const [barcodeError, setBarcodeError] = useState('');
  const [barcodeLengthMm, setBarcodeLengthMm] = useState(null);
  const [textValue, setTextValue] = useState('# Hello World');
  const [textError, setTextError] = useState('');
  const [textLengthMm, setTextLengthMm] = useState(null);
  const [textOrientation, setTextOrientation] = useState('rotated');
  const [textMinimumLengthMm, setTextMinimumLengthMm] = useState(15);
  const [textAlignment, setTextAlignment] = useState('start');
  const [imageFile, setImageFile] = useState(null);
  const [imageHeight, setImageHeight] = useState(1);
  const [imageLightenAmount, setImageLightenAmount] = useState(80);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState('');

  const canvasRef = useRef(null); // full 384px-wide canvas — hidden, this is what actually gets sent to the printer
  const previewCanvasRef = useRef(null); // visible content preview — cropped for labels, full width for receipts
  const rulerCanvasRef = useRef(null);
  const barcodeCanvasRef = useRef(null); // full 384px-wide canvas for barcode mode — hidden, sent to the printer
  const barcodePreviewCanvasRef = useRef(null); // cropped 15mm-wide canvas — what's shown on screen for barcode mode
  const textCanvasRef = useRef(null);
  const textPreviewCanvasRef = useRef(null);
  const imageCanvasRef = useRef(null);
  const imagePreviewCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const [showRuler, setShowRuler] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      imageRef.current = null;
      setImageHeight(1);
      setImageLoaded(false);
      setImageError('');
      return undefined;
    }

    setImageLoaded(false);
    const objectUrl = URL.createObjectURL(imageFile);
    const image = new Image();
    let cancelled = false;
    image.onload = () => {
      if (cancelled) return;
      if (!image.naturalWidth || !image.naturalHeight) {
        setImageError('The selected image has invalid dimensions.');
        return;
      }
      imageRef.current = image;
      setImageHeight(
        Math.max(1, Math.round((image.naturalHeight * LABEL_WIDTH) / image.naturalWidth))
      );
      setImageLoaded(true);
      setImageError('');
    };
    image.onerror = () => {
      if (!cancelled) {
        imageRef.current = null;
        setImageLoaded(false);
        setImageError('Could not load the selected image.');
      }
    };
    image.src = objectUrl;

    return () => {
      cancelled = true;
      imageRef.current = null;
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const drawImageLabel = useCallback(() => {
    const image = imageRef.current;
    const printCanvas = imageCanvasRef.current;
    const previewCanvas = imagePreviewCanvasRef.current;
    if (!image || !printCanvas || !previewCanvas) return;

    for (const canvas of [printCanvas, previewCanvas]) {
      canvas.width = LABEL_WIDTH;
      canvas.height = imageHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not create the image print canvas.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, LABEL_WIDTH, imageHeight);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      context.putImageData(ditherImageData(imageData, imageLightenAmount), 0, 0);
    }
  }, [imageHeight, imageLightenAmount]);

  useEffect(() => {
    if (mode === 'image' && imageRef.current) drawImageLabel();
  }, [mode, imageHeight, imageLoaded, drawImageLabel]);

  // Draws the label content (parsed from markdown) into the content
  // box, translated to sit at `contentLeft` within the given canvas
  // — shared between the full/hidden print canvas and the cropped
  // visible preview canvas. Both always render against the exact
  // same CONTENT_WIDTH for text layout, just spatially translated,
  // so the preview and the real print output can never diverge.
  //
  // boxHeight is the FULL canvas height (= the exact feed distance
  // the printer advances — must stay whatever the template says).
  // contentBoxHeight is a smaller, top-anchored region within that
  // where text actually gets positioned — the remainder is just
  // blank feed continuing on to the next label.
  const renderContent = useCallback(
    (ctx, boxWidth, boxHeight, contentLeft) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, boxWidth, boxHeight);

      const contentBoxHeight = Math.min(contentHeight, boxHeight);

      ctx.save();
      ctx.translate(contentLeft, 0);
      renderMarkdownContent(
        ctx,
        markdownContent,
        CONTENT_WIDTH,
        contentBoxHeight,
        { fontFamily, fontScale, marginPx }
      );

      // Visual-only outline around the content box — light gray
      // (~#dddddd) stays above the printer's black/white threshold
      // (200), so it's visible here but never actually prints as ink.
      // Skipped when the box already fills the whole canvas (the
      // cropped preview), since the canvas's own border already
      // shows that boundary.
      if (contentBoxHeight < boxHeight) {
        ctx.strokeStyle = '#dddddd';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(0.5, 0.5, CONTENT_WIDTH - 1, contentBoxHeight - 1);
      }
      ctx.restore();
    },
    [markdownContent, contentHeight, CONTENT_WIDTH, fontFamily, fontScale, marginPx]
  );

  // Full 384px-wide canvas — this is the real data sent to the
  // printer, kept off-screen (see className="label-canvas--hidden").
  const drawLabel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    renderContent(ctx, canvas.width, canvas.height, CONTENT_LEFT);
  }, [renderContent, CONTENT_LEFT]);

  // Cropped preview canvas — exactly CONTENT_WIDTH x contentHeight,
  // what you actually see on screen. contentLeft is 0 since this
  // canvas already IS the cropped content region.
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    renderContent(ctx, canvas.width, canvas.height, 0);
  }, [renderContent]);

  useEffect(() => {
    drawLabel();
    drawPreview();
  }, [drawLabel, drawPreview, feedHeight, contentHeight]);

  // Barcode mode's own draw pass. The print length depends on the
  // encoded value, so — unlike drawLabel/drawPreview — the canvases
  // are resized here (canvas.width/height are set imperatively,
  // which is also what clears them) rather than sized from a fixed
  // template. Generates the barcode once and draws it into both the
  // full print canvas (content anchored to the right edge, same
  // convention as the markdown modes) and the cropped preview.
  const drawBarcode = useCallback(() => {
    const printCanvas = barcodeCanvasRef.current;
    const previewCanvas = barcodePreviewCanvasRef.current;
    if (!printCanvas || !previewCanvas) return;

    setBarcodeError('');
    setBarcodeLengthMm(null);
    const value = barcodeValue.trim();

    if (!value) {
      printCanvas.width = LABEL_WIDTH;
      printCanvas.height = 1;
      previewCanvas.width = TAPE_WIDTH_PX;
      previewCanvas.height = 1;
      return;
    }

    let barcodeImage;
    try {
      barcodeImage = generateBarcodeCanvas(value, BARCODE_HEIGHT_PX);
    } catch (err) {
      setBarcodeError(err.message);
      printCanvas.width = LABEL_WIDTH;
      printCanvas.height = 1;
      previewCanvas.width = TAPE_WIDTH_PX;
      previewCanvas.height = 1;
      return;
    }

    const printLength = barcodeImage.width;
    setBarcodeLengthMm(printLength / BARCODE_PX_PER_MM);

    printCanvas.width = LABEL_WIDTH;
    printCanvas.height = printLength;
    const printCtx = printCanvas.getContext('2d');
    printCtx.fillStyle = '#ffffff';
    printCtx.fillRect(0, 0, printCanvas.width, printCanvas.height);
    printCtx.save();
    printCtx.translate(LABEL_WIDTH - TAPE_WIDTH_PX + BARCODE_SIDE_MARGIN_PX, 0);
    drawRotatedBarcode(printCtx, barcodeImage);
    printCtx.restore();

    previewCanvas.width = TAPE_WIDTH_PX;
    previewCanvas.height = printLength;
    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.fillStyle = '#ffffff';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.translate(BARCODE_SIDE_MARGIN_PX, 0);
    drawRotatedBarcode(previewCtx, barcodeImage);
  }, [barcodeValue]);

  useEffect(() => {
    if (mode === 'barcode') drawBarcode();
  }, [mode, drawBarcode]);

  const drawText = useCallback(() => {
    const printCanvas = textCanvasRef.current;
    const previewCanvas = textPreviewCanvasRef.current;
    if (!printCanvas || !previewCanvas) return;

    setTextError('');
    setTextLengthMm(null);
    printCanvas.width = LABEL_WIDTH;
    printCanvas.height = 1;
    previewCanvas.width = TAPE_WIDTH_PX;
    previewCanvas.height = 1;
    if (!textValue.trim()) {
      previewCanvas.height = Math.max(
        1,
        Math.round(textMinimumLengthMm * BARCODE_PX_PER_MM)
      );
      const previewContext = previewCanvas.getContext('2d');
      if (!previewContext) throw new Error('Could not create the text label preview canvas.');
      previewContext.fillStyle = '#ffffff';
      previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      return;
    }

    const textImage = generateTextCanvas(textValue, {
      orientation: textOrientation,
      minimumLengthMm: textMinimumLengthMm,
      alignment: textAlignment,
      fontFamily,
      fontScale,
      marginMm,
    });
    const rotated = textOrientation === 'rotated';
    const printLength = rotated ? textImage.width : textImage.height;
    setTextLengthMm(printLength / BARCODE_PX_PER_MM);

    printCanvas.width = LABEL_WIDTH;
    printCanvas.height = printLength;
    const printContext = printCanvas.getContext('2d');
    if (!printContext) throw new Error('Could not create the text label print canvas.');
    printContext.fillStyle = '#ffffff';
    printContext.fillRect(0, 0, printCanvas.width, printCanvas.height);
    if (rotated) {
      printContext.save();
      printContext.translate(LABEL_WIDTH - TAPE_WIDTH_PX, 0);
      drawRotatedCanvas(printContext, textImage);
      printContext.restore();
    } else {
      printContext.drawImage(textImage, LABEL_WIDTH - TAPE_WIDTH_PX, 0);
    }

    previewCanvas.width = TAPE_WIDTH_PX;
    previewCanvas.height = printLength;
    const previewContext = previewCanvas.getContext('2d');
    if (!previewContext) throw new Error('Could not create the text label preview canvas.');
    previewContext.fillStyle = '#ffffff';
    previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    if (rotated) drawRotatedCanvas(previewContext, textImage);
    else previewContext.drawImage(textImage, 0, 0);
  }, [
    textValue,
    textOrientation,
    textMinimumLengthMm,
    textAlignment,
    fontFamily,
    fontScale,
    marginMm,
  ]);

  useEffect(() => {
    if (mode !== 'text') return;
    try {
      drawText();
    } catch (err) {
      setTextError(err.message);
    }
  }, [mode, drawText]);

  const drawRuler = useCallback(() => {
    const ruler = rulerCanvasRef.current;
    if (!ruler) return;
    const ctx = ruler.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ruler.width, feedHeight);

    drawRulerTicks(ctx, ruler.width, feedHeight, { color: '#000000' });
  }, [feedHeight]);

  useEffect(() => {
    if (showRuler) drawRuler();
  }, [showRuler, drawRuler, feedHeight]);

  const {
    connected,
    busy,
    printDisabled,
    onPrint: handlePrintClick,
    handleConnect,
    handleDisconnect,
    handlePrintRuler,
  } = usePrinterActions({
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
    canvasRefs: {
      label: canvasRef,
      barcode: barcodeCanvasRef,
      text: textCanvasRef,
      image: imageCanvasRef,
      ruler: rulerCanvasRef,
    },
    setShowRuler,
    setStatus,
  });

  const preview =
    mode === 'image' ? (
      imageLoaded ? (
        <div className="preview">
          <canvas
            ref={imagePreviewCanvasRef}
            width={LABEL_WIDTH}
            height={imageHeight}
            className="label-canvas"
          />
        </div>
      ) : null
    ) : mode === 'barcode' ? (
      <div className="preview continuous-preview">
        <canvas
          ref={barcodePreviewCanvasRef}
          width={TAPE_WIDTH_PX}
          height={1}
          className="label-canvas"
        />
      </div>
    ) : mode === 'text' ? (
      <div className="preview continuous-preview">
        <canvas
          ref={textPreviewCanvasRef}
          width={TAPE_WIDTH_PX}
          height={1}
          className="label-canvas"
        />
      </div>
    ) : (
      <div className="preview">
        <canvas
          ref={previewCanvasRef}
          width={CONTENT_WIDTH}
          height={contentHeight}
          className="label-canvas"
        />
      </div>
    );
  const activeMode = STOCK_GROUPS.find((group) => group.id === stockGroup)?.modes.find(
    (option) => option.id === mode
  );
  const selectedTemplate =
    selectedCodeTemplate
      ? `code:${selectedCodeTemplate}`
      : selectedContentTemplate
        ? `saved:${selectedContentTemplate}`
        : '';

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">MARKLIFE P50S</p>
          <h1>Label Printer</h1>
        </div>
      </header>

      <PrintActions
        connected={connected}
        busy={busy}
        disabled={printDisabled}
        status={status}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onPrint={handlePrintClick}
      />

      <StockNavigation
        stockGroup={stockGroup}
        mode={mode}
        onSelectStockGroup={handleStockGroupSelect}
        onSelectMode={handleModeSelect}
      />

      <main className="workspace">
        <EditorPanel
          mode={mode}
          stockGroup={stockGroup}
          activeMode={activeMode}
          isReceiptMode={isReceiptMode}
          templateName={templateName}
          setTemplateName={setTemplateName}
          style={{
            fontFamily,
            setFontFamily: setFontFamilyOverride,
            textSize,
            setTextSize,
            marginMm,
            setMarginMm,
          }}
          manual={{
            selectedTemplate,
            contentTemplates,
            selectedContentTemplate,
            onSelectTemplate: handleTemplateSelect,
            onDeleteTemplate: (name) => {
              deleteTemplate(name);
              setSelectedContentTemplate('');
            },
            markdownContent,
            onMarkdownChange: (value) => {
              setSelectedCodeTemplate('');
              setSelectedContentTemplate('');
              setMarkdownContent(value);
            },
            newTemplateName,
            setNewTemplateName,
            onSaveTemplate: handleSaveTemplate,
          }}
          image={{
            error: imageError,
            loaded: imageLoaded,
            lightenAmount: imageLightenAmount,
            setLightenAmount: setImageLightenAmount,
            heightMm: imageHeight / BARCODE_PX_PER_MM,
            onSelectFile: (file) => {
              setImageError('');
              setImageLoaded(false);
              setImageFile(file);
            },
          }}
          prep={{
            itemName: prepItemName,
            setItemName: setPrepItemName,
            useByDate: prepUseByDate,
            setUseByDate: setPrepUseByDate,
          }}
          barcode={{
            value: barcodeValue,
            setValue: setBarcodeValue,
            error: barcodeError,
          }}
          text={{
            orientation: textOrientation,
            setOrientation: setTextOrientation,
            value: textValue,
            setValue: setTextValue,
            minimumLengthMm: textMinimumLengthMm,
            setMinimumLengthMm: setTextMinimumLengthMm,
            alignment: textAlignment,
            setAlignment: setTextAlignment,
            error: textError,
          }}
        />
        <LabelPreview
          mode={mode}
          stockGroup={stockGroup}
          barcodeLengthMm={barcodeLengthMm}
          textLengthMm={textLengthMm}
          preview={preview}
          showRuler={showRuler}
          rulerCanvasRef={rulerCanvasRef}
          labelWidth={LABEL_WIDTH}
          feedHeight={feedHeight}
        />
      </main>

      {/* Full 384px-wide canvas at the full feed height — not shown,
          but must stay mounted since it's what actually gets sent to
          printLabel(). The extra height beyond contentHeight is
          blank feed continuing on to the next label. */}
      <canvas
        ref={canvasRef}
        width={LABEL_WIDTH}
        height={feedHeight}
        style={{ display: 'none' }}
      />

      {/* Full 384px-wide canvas for barcode mode — hidden, sized
          dynamically in drawBarcode() to match the encoded value's
          print length. */}
      <canvas ref={barcodeCanvasRef} width={LABEL_WIDTH} height={1} style={{ display: 'none' }} />
      <canvas ref={textCanvasRef} width={LABEL_WIDTH} height={1} style={{ display: 'none' }} />
      <canvas ref={imageCanvasRef} width={LABEL_WIDTH} height={1} style={{ display: 'none' }} />

      <footer className="app-footer">
        <span>
          Requires Chrome or Edge over HTTPS (or localhost) — Web Bluetooth isn't supported in
          Safari or Firefox.
        </span>
        <PrintTestButton connected={connected} busy={busy} onClick={handlePrintRuler} />
      </footer>
    </div>
  );
}

export default App;
