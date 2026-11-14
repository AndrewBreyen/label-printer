import React from 'react';
import {
  DEFAULT_MARGIN_MM,
  FONT_OPTIONS,
  MAX_MARGIN_MM,
} from '../../config/appConfig';

export default function TextStyleControls({
  fontFamily,
  setFontFamily,
  textSize,
  setTextSize,
  marginMm,
  setMarginMm,
}) {
  return (
    <section className="text-style-controls" aria-label="Text style">
      <div className="text-style-heading">
        <span>Text style</span>
        <button
          type="button"
          className={`marginless-button${marginMm === 0 ? ' is-selected' : ''}`}
          aria-pressed={marginMm === 0}
          onClick={() => setMarginMm(marginMm === 0 ? DEFAULT_MARGIN_MM : 0)}
        >
          No margins
        </button>
      </div>
      <div className="text-style-grid">
        <label className="field">
          <span>Font</span>
          <select
            aria-label="Text font"
            value={fontFamily}
            onChange={(event) => setFontFamily(event.target.value)}
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Text size</span>
          <select value={textSize} onChange={(event) => setTextSize(event.target.value)}>
            <option value="small">Small</option>
            <option value="standard">Standard</option>
            <option value="large">Large</option>
          </select>
        </label>
        <label className="field">
          <span>Margins</span>
          <div className="margin-range">
            <input
              type="range"
              aria-label="Margins in millimeters"
              min="0"
              max={MAX_MARGIN_MM}
              step="0.25"
              value={marginMm}
              onChange={(event) => setMarginMm(Number(event.target.value))}
            />
            <output>{marginMm} mm</output>
          </div>
        </label>
      </div>
      <p className="field-hint">
        Styles apply to this label. Markdown headings keep their relative sizes.
      </p>
    </section>
  );
}
