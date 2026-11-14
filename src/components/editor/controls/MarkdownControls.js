import React from 'react';
import { MARKDOWN_TEMPLATES } from '../../../utils/markdownTemplates';
import MarkdownHelp from './MarkdownHelp';

export default function MarkdownControls({ isManual, manual }) {
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
