import { MIN_LENGTH_MM } from './labelTemplates';
import { PX_PER_MM, TAPE_WIDTH_PX } from './barcodeUtils';
import {
  getMarkdownContentHeight,
  getMarkdownContentWidth,
  renderMarkdownContent,
} from './markdown';

export const MAX_TEXT_LABEL_LENGTH_MM = 1000;

/** Creates a 15mm-wide label canvas in rotated or normal text orientation. */
export function generateTextCanvas(
  markdown,
  { orientation = 'rotated', minimumLengthMm = MIN_LENGTH_MM, alignment = 'start' } = {}
) {
  if (!markdown.trim()) {
    throw new Error('Enter text to print.');
  }

  if (!Number.isFinite(minimumLengthMm) ||
      minimumLengthMm < MIN_LENGTH_MM ||
      minimumLengthMm > MAX_TEXT_LABEL_LENGTH_MM) {
    throw new Error(
      `Minimum label length must be between ${MIN_LENGTH_MM} and ${MAX_TEXT_LABEL_LENGTH_MM} mm.`
    );
  }
  if (!['rotated', 'normal'].includes(orientation)) {
    throw new Error('Choose a valid text orientation.');
  }
  if (!['start', 'center', 'end'].includes(alignment)) {
    throw new Error('Choose a valid label alignment.');
  }

  const minimumLengthPx = Math.ceil(minimumLengthMm * PX_PER_MM);
  const rotated = orientation === 'rotated';
  const requiredLength = rotated
    ? getMarkdownContentWidth(markdown)
    : getMarkdownContentHeight(markdown, TAPE_WIDTH_PX);
  if (requiredLength <= 0) {
    throw new Error('Could not measure the text label.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = rotated ? Math.max(minimumLengthPx, Math.ceil(requiredLength)) : TAPE_WIDTH_PX;
  canvas.height = rotated
    ? TAPE_WIDTH_PX
    : Math.max(minimumLengthPx, Math.ceil(requiredLength));

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not create a canvas for the text label.');
  }

  if (rotated) {
    const contentHeight = getMarkdownContentHeight(markdown, canvas.width);
    const layoutHeight = Math.max(TAPE_WIDTH_PX, contentHeight);
    const verticalScale = TAPE_WIDTH_PX / layoutHeight;
    context.save();
    if (verticalScale < 1) context.scale(1, verticalScale);
    renderMarkdownContent(context, markdown, canvas.width, layoutHeight, {
      horizontalAlign: alignment === 'start' ? 'left' : alignment === 'end' ? 'right' : 'center',
      verticalAlign: 'top',
    });
    context.restore();
  } else {
    renderMarkdownContent(context, markdown, canvas.width, canvas.height, {
      verticalAlign: alignment === 'start' ? 'top' : alignment === 'end' ? 'bottom' : 'center',
    });
  }

  return canvas;
}
