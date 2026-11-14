import React from 'react';
import { MIN_LENGTH_MM } from '../../../utils/labelTemplates';
import { MAX_TEXT_LABEL_LENGTH_MM } from '../../../utils/textLabelUtils';
import MarkdownHelp from './MarkdownHelp';

export function ImageControls({ image }) {
  return (
    <>
      <label className="field">
        <span>Image to print</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => image.onSelectFile(event.target.files?.[0] || null)}
        />
      </label>
      {image.error && <p className="inline-error" role="alert">{image.error}</p>}
      {image.loaded && (
        <>
          <label className="field">
            <span>Lighten image: {image.lightenAmount}</span>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={image.lightenAmount}
              onChange={(event) => image.setLightenAmount(Number(event.target.value))}
              aria-label="Lighten image"
            />
            <span className="image-darkness-scale">
              <span>Darker</span>
              <span>Lighter</span>
            </span>
            <span className="hint">
              Adds brightness before dithering; increase this if the print is too dark.
            </span>
          </label>
          <p className="hint">
            Converted to dithered black and white, printed at 58mm width with the original aspect
            ratio. Approximate length: {image.heightMm.toFixed(1)} mm.
          </p>
        </>
      )}
    </>
  );
}

export function PrepControls({ prep }) {
  return (
    <>
      <label className="field">
        <span>Item name</span>
        <input
          type="text"
          value={prep.itemName}
          onChange={(event) => prep.setItemName(event.target.value)}
          placeholder="e.g. Egg"
          maxLength={40}
        />
      </label>
      <label className="field">
        <span>Use by date</span>
        <input
          type="date"
          value={prep.useByDate}
          onChange={(event) => prep.setUseByDate(event.target.value)}
        />
      </label>
      <p className="hint">
        PREP shows the current date/time automatically. USE BY shows the date you pick above,
        paired with the current time — both refresh to the live time right before printing.
      </p>
    </>
  );
}

export function BarcodeControls({ barcode }) {
  return (
    <>
      <label className="field">
        <span>Value to encode (CODE128)</span>
        <input
          type="text"
          value={barcode.value}
          onChange={(event) => barcode.setValue(event.target.value)}
          placeholder="e.g. SKU-10294"
          maxLength={80}
        />
      </label>
      {barcode.error && <p className="inline-error" role="alert">{barcode.error}</p>}
      <p className="field-hint">Prints along the length of 15 mm continuous tape.</p>
    </>
  );
}

export function TextControls({ text }) {
  return (
    <>
      <label className="field">
        <span>Text to print</span>
        <textarea
          className="markdown-input"
          aria-label="Text to print"
          value={text.value}
          onChange={(event) => text.setValue(event.target.value)}
          placeholder={'# Big heading\n## Smaller heading\nBody text'}
          rows={6}
        />
        <MarkdownHelp />
      </label>
      <label className="field">
        <span>Minimum label length (mm)</span>
        <input
          type="number"
          aria-label="Minimum label length (mm)"
          min={MIN_LENGTH_MM}
          max={MAX_TEXT_LABEL_LENGTH_MM}
          step="1"
          value={text.minimumLengthMm}
          onChange={(event) => text.setMinimumLengthMm(Number(event.target.value))}
        />
        <span className="hint">The label grows automatically if the text needs more room.</span>
      </label>
      {text.error && <p className="inline-error" role="alert">{text.error}</p>}
    </>
  );
}

