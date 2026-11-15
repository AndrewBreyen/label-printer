import React from 'react';
import { MIN_LENGTH_MM, MAX_CONTINUOUS_LENGTH_MM } from '../../../utils/labelTemplates';
import MarkdownHelp from './MarkdownHelp';

function MinimumLengthControl({ minimumLength }) {
  const [error, setError] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const displayLength = minimumLength.minimumLengthMm ?? minimumLength.naturalLengthMm;
  const [draftLength, setDraftLength] = React.useState(
    Number.isFinite(displayLength) ? String(displayLength) : ''
  );

  React.useEffect(() => {
    if (!isEditing) {
      setDraftLength(Number.isFinite(displayLength) ? String(displayLength) : '');
    }
  }, [displayLength, isEditing]);

  const handleChange = (event) => {
    const rawValue = event.target.value;
    setDraftLength(rawValue);
    if (!rawValue) {
      setError('');
      return;
    }

    const value = Number(rawValue);
    if (
      !Number.isFinite(value) ||
      value < MIN_LENGTH_MM ||
      value > MAX_CONTINUOUS_LENGTH_MM
    ) {
      setError(
        `Enter a length between ${MIN_LENGTH_MM} and ${MAX_CONTINUOUS_LENGTH_MM} mm.`
      );
      return;
    }

    minimumLength.setMinimumLengthMm(value);
    setError('');
  };

  const handleFitContent = () => {
    minimumLength.setMinimumLengthMm(null);
    setError('');
  };

  return (
    <div className="field">
      <label htmlFor="minimum-label-length">Minimum label length (mm)</label>
      <div className="minimum-length-row">
        <input
          id="minimum-label-length"
          type="number"
          min={MIN_LENGTH_MM}
          max={MAX_CONTINUOUS_LENGTH_MM}
          step="any"
          value={draftLength}
          onFocus={() => setIsEditing(true)}
          onChange={handleChange}
          onBlur={() => {
            setIsEditing(false);
            if (!draftLength || error) {
              setDraftLength(Number.isFinite(displayLength) ? String(displayLength) : '');
              setError('');
            }
          }}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="button button--quiet minimum-length-reset"
          onClick={handleFitContent}
          title="Use the shortest length that fits the current content"
        >
          Fit content
        </button>
      </div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <span className="hint">The label grows if the content needs more room.</span>
    </div>
  );
}

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

export function PrepControls({ prep, minimumLength }) {
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
      {minimumLength && (
        <MinimumLengthControl minimumLength={minimumLength} />
      )}
      <p className="hint">
        PREP shows the current date/time automatically. USE BY shows the date you pick above,
        paired with the current time — both refresh to the live time right before printing.
      </p>
    </>
  );
}

export function BarcodeControls({ barcode, minimumLength }) {
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
      <MinimumLengthControl minimumLength={minimumLength} />
      <p className="field-hint">Prints along the length of 15 mm continuous tape.</p>
    </>
  );
}

export function TextControls({ text, minimumLength }) {
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
      <MinimumLengthControl minimumLength={minimumLength} />
      {text.error && <p className="inline-error" role="alert">{text.error}</p>}
    </>
  );
}

