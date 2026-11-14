import React from 'react';
import { LABEL_TEMPLATES, MIN_LENGTH_MM } from '../../utils/labelTemplates';
import { MARKDOWN_TEMPLATES } from '../../utils/markdownTemplates';
import { MAX_TEXT_LABEL_LENGTH_MM } from '../../utils/textLabelUtils';
import TextStyleControls from './TextStyleControls';

function MarkdownHelp() {
  return (
    <p className="hint">
      <code># text</code> = big heading, <code>## text</code> = smaller heading, plain text =
      body, blank line = spacing. <code>{'{{now}}'}</code> and <code>{'{{now+7d}}'}</code>{' '}
      insert live dates.
    </p>
  );
}

function MarkdownControls({ isManual, manual }) {
  return (
    <>
      {isManual && (
        <label className="field">
          <span>Start from a template</span>
          <div className="save-template-row">
            <select
              aria-label="Start from a template"
              value={manual.selectedTemplate}
              onChange={(event) => manual.onSelectTemplate(event.target.value)}
            >
              <option value="">Choose a template...</option>
              <optgroup label="Built-in">
                {Object.keys(MARKDOWN_TEMPLATES).map((name) => (
                  <option key={name} value={`code:${name}`}>
                    {name}
                  </option>
                ))}
              </optgroup>
              {manual.contentTemplates.length > 0 && (
                <optgroup label="Saved">
                  {manual.contentTemplates.map((savedTemplate) => (
                    <option key={savedTemplate.name} value={`saved:${savedTemplate.name}`}>
                      {savedTemplate.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {manual.selectedContentTemplate && (
              <button
                type="button"
                className="button button--quiet"
                onClick={() => manual.onDeleteTemplate(manual.selectedContentTemplate)}
              >
                Delete
              </button>
            )}
          </div>
        </label>
      )}

      <label className="field">
        <span>Label content (markdown)</span>
        <textarea
          className="markdown-input"
          value={manual.markdownContent}
          onChange={(event) => manual.onMarkdownChange(event.target.value)}
          placeholder={'# Big heading\n## Smaller heading\nBody text'}
          rows={6}
        />
        <MarkdownHelp />
      </label>

      {isManual && (
        <label className="field">
          <span>Save current as template</span>
          <div className="save-template-row">
            <input
              type="text"
              value={manual.newTemplateName}
              onChange={(event) => manual.setNewTemplateName(event.target.value)}
              placeholder="Template name"
              maxLength={40}
            />
            <button
              type="button"
              className="button button--quiet"
              onClick={manual.onSaveTemplate}
              disabled={!manual.newTemplateName.trim()}
            >
              Save
            </button>
          </div>
        </label>
      )}
    </>
  );
}

function ImageControls({ image }) {
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

function PrepControls({ prep }) {
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

function BarcodeControls({ barcode }) {
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

function TextControls({ text }) {
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
      <label className="field">
        <span>Alignment along label length</span>
        <select
          value={text.alignment}
          onChange={(event) => text.setAlignment(event.target.value)}
        >
          <option value="start">Start (top of preview)</option>
          <option value="center">Center</option>
          <option value="end">End</option>
        </select>
      </label>
      {text.error && <p className="inline-error" role="alert">{text.error}</p>}
      <p className="hint">
        Start alignment puts text at the beginning of the label without blank lines. The preview
        updates as you type or change these settings.
      </p>
    </>
  );
}

export default function EditorPanel({
  mode,
  stockGroup,
  activeMode,
  isReceiptMode,
  templateName,
  setTemplateName,
  style,
  manual,
  image,
  prep,
  barcode,
  text,
}) {
  return (
    <div className="panel">
      {mode === 'text' ? (
        <div className="orientation-toolbar">
          <span id="text-orientation-label">Text orientation</span>
          <div className="orientation-picker" role="group" aria-labelledby="text-orientation-label">
            <button
              type="button"
              className={`orientation-choice${text.orientation === 'normal' ? ' is-selected' : ''}`}
              aria-pressed={text.orientation === 'normal'}
              onClick={() => text.setOrientation('normal')}
            >
              Horizontal
            </button>
            <button
              type="button"
              className={`orientation-choice${text.orientation === 'rotated' ? ' is-selected' : ''}`}
              aria-pressed={text.orientation === 'rotated'}
              onClick={() => text.setOrientation('rotated')}
            >
              Vertical
            </button>
          </div>
        </div>
      ) : (
        <div className="panel-heading">
          <div>
            <p className="eyebrow">CONFIGURE</p>
            <h2>{activeMode?.label || 'Label'}</h2>
          </div>
        </div>
      )}

      {stockGroup === 'small' && (
        <label className="field">
          <span>Label size</span>
          <select value={templateName} onChange={(event) => setTemplateName(event.target.value)}>
            {Object.keys(LABEL_TEMPLATES).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}

      {mode !== 'image' && mode !== 'barcode' && <TextStyleControls {...style} />}

      {(mode === 'manual' || isReceiptMode) && (
        <MarkdownControls isManual={mode === 'manual'} manual={manual} />
      )}
      {isReceiptMode && (
        <p className="hint">
          Prints on 58mm continuous receipt paper using the full 384-dot print width. Receipt
          length adjusts to the markdown content.
        </p>
      )}
      {mode === 'image' && <ImageControls image={image} />}
      {mode === 'prep' && <PrepControls prep={prep} />}
      {mode === 'barcode' && <BarcodeControls barcode={barcode} />}
      {mode === 'text' && <TextControls text={text} />}
    </div>
  );
}
