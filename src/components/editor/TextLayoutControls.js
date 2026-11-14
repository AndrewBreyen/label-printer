import React from 'react';

const ALIGNMENT_OPTIONS = [
  { value: 'start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'End' },
];

export default function TextLayoutControls({ text }) {
  const alignmentLabel =
    text.orientation === 'rotated' ? 'Alignment across label width' : 'Alignment along label length';

  return (
    <div className="text-toolbar">
      <div className="text-toolbar-control">
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

      <div className="text-toolbar-control">
        <span id="text-alignment-label">{alignmentLabel}</span>
        <div
          className="orientation-picker alignment-picker"
          role="group"
          aria-labelledby="text-alignment-label"
        >
          {ALIGNMENT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`orientation-choice${text.alignment === value ? ' is-selected' : ''}`}
              aria-pressed={text.alignment === value}
              onClick={() => text.setAlignment(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
