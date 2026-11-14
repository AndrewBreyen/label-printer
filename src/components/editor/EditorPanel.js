import React from 'react';
import { LABEL_TEMPLATES } from '../../utils/labelTemplates';
import TextStyleControls from './TextStyleControls';
import TextLayoutControls from './TextLayoutControls';
import MarkdownControls from './controls/MarkdownControls';
import {
  BarcodeControls,
  ImageControls,
  PrepControls,
  TextControls,
} from './controls/ModeControls';

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
        <TextLayoutControls text={text} />
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
