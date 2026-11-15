import React from 'react';
import { STOCK_GROUPS } from '../../config/appConfig';

export default function LabelPreview({
  mode,
  stockGroup,
  barcodeLengthMm,
  textLengthMm,
  markdownLengthMm,
  preview,
  showRuler,
  rulerCanvasRef,
  labelWidth,
  feedHeight,
}) {
  const activeMode = STOCK_GROUPS.find((group) => group.id === stockGroup)?.modes.find(
    (option) => option.id === mode
  );

  return (
    <aside className="preview-card" aria-label="Label preview">
      <div className="preview-heading">
        <div>
          <p className="eyebrow">LIVE PREVIEW</p>
          <h2>{activeMode?.label || 'Label'} preview</h2>
        </div>
        {(mode === 'barcode' && barcodeLengthMm !== null) ||
        (mode === 'text' && textLengthMm !== null) ? (
          <span className="preview-length">
            {mode === 'barcode' ? barcodeLengthMm : textLengthMm} mm
          </span>
        ) : mode === 'prep15' && markdownLengthMm !== null ? (
          <span className="preview-length">{markdownLengthMm.toFixed(1)} mm</span>
        ) : null}
      </div>
      {preview || (
        <div className="preview-placeholder">
          {mode === 'image' ? 'Choose an image to preview' : 'Preview will appear here'}
        </div>
      )}
      {showRuler && (
        <div className="ruler-preview">
          <p className="eyebrow">RULER TEST</p>
          <canvas
            ref={rulerCanvasRef}
            width={labelWidth}
            height={feedHeight}
            className="label-canvas"
          />
        </div>
      )}
      <p className="preview-note">
        Preview is scaled to fit. Printed output uses the selected stock size.
      </p>
    </aside>
  );
}
