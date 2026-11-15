import { useEffect, useState } from 'react';
import { useContentTemplates } from '../../hooks/useContentTemplates';
import {
  DEFAULT_MARGIN_MM,
  FONT_OPTIONS,
  MAX_MARGIN_MM,
  TEXT_SIZE_SCALES,
} from '../../config/appConfig';
import { MARKDOWN_TEMPLATES } from '../../utils/markdownTemplates';

const DEFAULT_MARKDOWN = '# Hello World';

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function useLabelEditor({
  mode,
  isReceiptMode,
  templateName,
  setTemplateName,
  setStatus,
}) {
  const [markdownContent, setMarkdownContent] = useState(DEFAULT_MARKDOWN);
  const [fontFamilyOverride, setFontFamilyOverride] = useState(null);
  const [textSize, setTextSize] = useState('standard');
  const [marginMm, setMarginMm] = useState(DEFAULT_MARGIN_MM);
  const [selectedContentTemplate, setSelectedContentTemplate] = useState('');
  const [selectedCodeTemplate, setSelectedCodeTemplate] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [prepItemName, setPrepItemName] = useState('');
  const [prepUseByDate, setPrepUseByDate] = useState(getTodayISO);
  const { templates: contentTemplates, saveTemplate, deleteTemplate } = useContentTemplates();
  const fontFamily = fontFamilyOverride ?? (isReceiptMode ? 'monospace' : 'sans-serif');
  const fontScale = TEXT_SIZE_SCALES[textSize];

  const applyContentTemplate = (name) => {
    const savedTemplate = contentTemplates.find((item) => item.name === name);
    if (!savedTemplate) return;

    setSelectedContentTemplate(name);
    setMarkdownContent(savedTemplate.markdown);
    setFontFamilyOverride(
      FONT_OPTIONS.some((option) => option.value === savedTemplate.fontFamily)
        ? savedTemplate.fontFamily
        : null
    );
    setTextSize(
      Object.hasOwn(TEXT_SIZE_SCALES, savedTemplate.textSize) ? savedTemplate.textSize : 'standard'
    );
    setMarginMm(
      Number.isFinite(savedTemplate.marginMm) &&
        savedTemplate.marginMm >= 0 &&
        savedTemplate.marginMm <= MAX_MARGIN_MM
        ? savedTemplate.marginMm
        : DEFAULT_MARGIN_MM
    );
  };

  const applyCodeTemplate = (name) => {
    const codeTemplate = MARKDOWN_TEMPLATES[name];
    if (!codeTemplate) return;

    setSelectedCodeTemplate(name);
    setSelectedContentTemplate('');
    setMarkdownContent(codeTemplate.markdown);
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

  const handleMarkdownChange = (value) => {
    setSelectedCodeTemplate('');
    setSelectedContentTemplate('');
    setMarkdownContent(value);
  };

  const handleDeleteTemplate = (name) => {
    deleteTemplate(name);
    setSelectedContentTemplate('');
  };

  useEffect(() => {
    if (mode !== 'prep' && mode !== 'prep15') return;

    const [year, month, day] = prepUseByDate.split('-').map(Number);
    const useByLabel =
      year && month && day
        ? new Date(year, month - 1, day).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          })
        : '';
    const name = prepItemName.trim() || 'Item';
    setMarkdownContent(`# ${name}\n\nPREP\n## {{now}}\n\nUSE BY\n## ${useByLabel} {{nowtime}}`);
  }, [mode, prepItemName, prepUseByDate]);

  const selectedTemplate = selectedCodeTemplate
    ? `code:${selectedCodeTemplate}`
    : selectedContentTemplate
      ? `saved:${selectedContentTemplate}`
      : '';

  return {
    markdownContent,
    fontFamily,
    fontScale,
    marginMm,
    editor: {
      templateName,
      setTemplateName,
      style: {
        fontFamily,
        setFontFamily: setFontFamilyOverride,
        textSize,
        setTextSize,
        marginMm,
        setMarginMm,
      },
      manual: {
        selectedTemplate,
        contentTemplates,
        selectedContentTemplate,
        onSelectTemplate: handleTemplateSelect,
        onDeleteTemplate: handleDeleteTemplate,
        markdownContent,
        onMarkdownChange: handleMarkdownChange,
        newTemplateName,
        setNewTemplateName,
        onSaveTemplate: handleSaveTemplate,
      },
      prep: {
        itemName: prepItemName,
        setItemName: setPrepItemName,
        useByDate: prepUseByDate,
        setUseByDate: setPrepUseByDate,
      },
    },
  };
}
