/**
 * markdown.js
 * -----------
 * A tiny markdown-inspired layout language for label content, so
 * templates can be written as plain, readable text instead of
 * separate title/subtitle/fontSize/position fields.
 *
 * Syntax:
 *   # Big heading       -> large bold text (H1)
 *   ## Smaller heading   -> medium bold text (H2)
 *   Plain text line      -> regular body text
 *   (blank line)          -> extra vertical spacing between blocks
 *
 * Placeholders (resolved fresh every time it's rendered):
 *   {{now}}        -> current date/time, e.g. "7/29 2:30 PM"
 *   {{now+7d}}     -> date/time 7 days from now (any integer works)
 *   {{nowtime}}    -> current time only, e.g. "2:30 PM" (useful when
 *                     combining a fixed/picked date with a live time)
 *
 * Text wraps at word boundaries to fit the available width. Everything
 * is centered horizontally per line and the whole block of content is
 * centered vertically as a group, then nudged by the xOffset/yOffset
 * fine-tune sliders.
 */

const FONT_SIZES = { h1: 32, h2: 22, body: 18 };
const LINE_HEIGHT_RATIO = 1.3;
const BLANK_LINE_GAP = 10;

function getMarkdownBlocks(markdown, fontScale = 1) {
  return parseMarkdownLines(markdown).map((line) => {
    if (line.type === 'space') return { type: 'space', height: BLANK_LINE_GAP };
    const fontSize = Math.round(FONT_SIZES[line.type] * fontScale);
    return {
      type: line.type,
      text: resolvePlaceholders(line.text),
      fontSize,
      bold: line.type !== 'body',
      height: Math.round(fontSize * LINE_HEIGHT_RATIO),
    };
  });
}

function wrapText(context, text, maxWidth) {
  const lines = [];
  let line = '';

  const appendWord = (word) => {
    if (context.measureText(word).width <= maxWidth) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
      return;
    }

    if (line) {
      lines.push(line);
      line = '';
    }

    let segment = '';
    for (const character of word) {
      if (segment && context.measureText(segment + character).width > maxWidth) {
        lines.push(segment);
        segment = character;
      } else {
        segment += character;
      }
    }
    line = segment;
  };

  for (const word of text.split(/\s+/)) {
    if (word) appendWord(word);
  }
  if (line) lines.push(line);
  return lines;
}

function getLaidOutBlocks(markdown, context, maxWidth, fontFamily, fontScale) {
  return getMarkdownBlocks(markdown, fontScale).map((block) => {
    if (block.type === 'space') return { ...block, lines: [] };
    context.font = `${block.bold ? 'bold ' : ''}${block.fontSize}px ${fontFamily}`;
    const lines = wrapText(context, block.text, maxWidth);
    return { ...block, lines, height: block.height * lines.length };
  });
}

function formatDateTime(date) {
  // Compact format that fits a small label: "7/29 2:30 PM"
  const datePart = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${datePart} ${timePart}`;
}

function formatTimeOnly(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Replaces {{now}}, {{now+Nd}}, and {{nowtime}} placeholders with formatted dates/times. */
export function resolvePlaceholders(text) {
  return text
    .replace(/\{\{\s*nowtime\s*\}\}/g, () => formatTimeOnly(new Date()))
    .replace(/\{\{\s*now\s*\}\}/g, () => formatDateTime(new Date()))
    .replace(/\{\{\s*now\s*\+\s*(\d+)\s*d\s*\}\}/g, (_, days) => {
      const d = new Date();
      d.setDate(d.getDate() + Number(days));
      return formatDateTime(d);
    });
}

/** Splits raw markdown text into typed lines (h1 / h2 / body / space). */
export function parseMarkdownLines(markdown) {
  return markdown.split('\n').map((line) => {
    const trimmed = line.trim();
    if (trimmed === '') return { type: 'space' };
    if (trimmed.startsWith('## ')) return { type: 'h2', text: trimmed.slice(3) };
    if (trimmed.startsWith('# ')) return { type: 'h1', text: trimmed.slice(2) };
    return { type: 'body', text: trimmed };
  });
}

/** Returns the vertical space required to render markdown, optionally wrapping to a width. */
export function getMarkdownContentHeight(
  markdown,
  boxWidth,
  fontFamily = 'sans-serif',
  fontScale = 1,
  marginPx = 10
) {
  if (boxWidth === undefined) {
    return getMarkdownBlocks(markdown, fontScale).reduce((sum, block) => sum + block.height, 0);
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create a canvas context to measure markdown.');
  return getLaidOutBlocks(markdown, context, boxWidth - marginPx * 2, fontFamily, fontScale).reduce(
    (sum, block) => sum + block.height,
    0
  );
}

/** Returns the horizontal space required by the widest rendered markdown line. */
export function getMarkdownContentWidth(markdown, options = {}) {
  const measureCanvas = document.createElement('canvas');
  const context = measureCanvas.getContext('2d');
  if (!context) return 0;
  const fontFamily = options.fontFamily ?? 'sans-serif';
  const fontScale = options.fontScale ?? 1;
  const marginPx = options.marginPx ?? 10;

  const widestLine = getMarkdownBlocks(markdown, fontScale).reduce((maxWidth, block) => {
    if (block.type === 'space') return maxWidth;
    context.font = `${block.bold ? 'bold ' : ''}${block.fontSize}px ${fontFamily}`;
    return Math.max(maxWidth, context.measureText(block.text).width);
  }, 0);
  return widestLine + marginPx * 2;
}

/**
 * Renders markdown label content onto a canvas context, filling the
 * boxWidth x boxHeight area (white background + centered text).
 * Placeholders are resolved at render time, so calling this again
 * later (e.g. right before printing) naturally picks up the current
 * date/time without any separate "refresh" step.
 */
export function renderMarkdownContent(ctx, markdown, boxWidth, boxHeight, options = {}) {
  const xOffset = options.xOffset ?? 0;
  const yOffset = options.yOffset ?? 0;
  const fontFamily = options.fontFamily ?? 'sans-serif';
  const fontScale = options.fontScale ?? 1;
  const marginPx = options.marginPx ?? 10;
  const horizontalAlign = options.horizontalAlign ?? 'center';
  const verticalAlign = options.verticalAlign ?? 'center';
  const alignInkToEdge = options.alignInkToEdge ?? false;

  if (!Number.isFinite(fontScale) || fontScale <= 0) {
    throw new Error('Font size must be a positive number.');
  }
  if (!Number.isFinite(marginPx) || marginPx < 0 || marginPx * 2 >= boxWidth) {
    throw new Error('Margins must be non-negative and leave room for text.');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, boxWidth, boxHeight);

  const maxTextWidth = boxWidth - marginPx * 2;
  const blocks = getLaidOutBlocks(markdown, ctx, maxTextWidth, fontFamily, fontScale);

  const totalHeight = blocks.reduce((sum, b) => sum + b.height, 0);
  const verticalOffsets = {
    top: marginPx,
    center: (boxHeight - totalHeight) / 2,
    bottom: boxHeight - totalHeight - marginPx,
  };
  const horizontalPositions = {
    left: { textAlign: 'left', x: marginPx },
    center: { textAlign: 'center', x: boxWidth / 2 },
    right: { textAlign: 'right', x: boxWidth - marginPx },
  };
  if (!(verticalAlign in verticalOffsets) || !(horizontalAlign in horizontalPositions)) {
    throw new Error('Invalid markdown text alignment.');
  }
  ctx.fillStyle = '#000000';
  ctx.textAlign = horizontalPositions[horizontalAlign].textAlign;
  ctx.textBaseline = 'middle';

  const lines = [];
  let lineTop = 0;
  for (const block of blocks) {
    if (block.type === 'space') {
      lineTop += block.height;
      continue;
    }
    const font = `${block.bold ? 'bold ' : ''}${block.fontSize}px ${fontFamily}`;
    const lineHeight = Math.round(block.fontSize * LINE_HEIGHT_RATIO);
    for (const line of block.lines) {
      lines.push({ line, font, baseline: lineTop + lineHeight / 2 });
      lineTop += lineHeight;
    }
  }

  let offset = verticalOffsets[verticalAlign] - yOffset;
  if (alignInkToEdge && verticalAlign !== 'center') {
    let inkTop = Infinity;
    let inkBottom = -Infinity;
    for (const { line, font, baseline } of lines) {
      if (!line.trim()) continue;
      ctx.font = font;
      const { actualBoundingBoxAscent, actualBoundingBoxDescent } = ctx.measureText(line);
      if (!Number.isFinite(actualBoundingBoxAscent) || !Number.isFinite(actualBoundingBoxDescent)) {
        continue;
      }
      inkTop = Math.min(inkTop, baseline - actualBoundingBoxAscent);
      inkBottom = Math.max(inkBottom, baseline + actualBoundingBoxDescent);
    }
    if (Number.isFinite(inkTop) && inkBottom - inkTop <= boxHeight) {
      offset = (verticalAlign === 'top' ? -inkTop : boxHeight - inkBottom) - yOffset;
    }
  }

  const textX = horizontalPositions[horizontalAlign].x + xOffset;
  for (const { line, font, baseline } of lines) {
    ctx.font = font;
    ctx.fillText(line, textX, baseline + offset, maxTextWidth);
  }
}
