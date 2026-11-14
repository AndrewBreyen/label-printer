import { useCallback, useEffect, useRef } from 'react';
import { drawRulerTicks } from '../../utils/rulerUtils';
import { renderMarkdownContent } from '../../utils/markdown';

export default function useMarkdownLabel({
  markdown,
  labelWidth,
  contentWidth,
  contentLeft,
  contentHeight,
  feedHeight,
  fontFamily,
  fontScale,
  marginPx,
  showRuler,
}) {
  const printCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const rulerCanvasRef = useRef(null);

  const renderContent = useCallback((context, canvasWidth, canvasHeight, left) => {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    const textHeight = Math.min(contentHeight, canvasHeight);
    context.save();
    context.translate(left, 0);
    renderMarkdownContent(context, markdown, contentWidth, textHeight, {
      fontFamily,
      fontScale,
      marginPx,
    });

    if (textHeight < canvasHeight) {
      context.strokeStyle = '#dddddd';
      context.lineWidth = 1;
      context.setLineDash([4, 4]);
      context.strokeRect(0.5, 0.5, contentWidth - 1, textHeight - 1);
    }
    context.restore();
  }, [contentHeight, contentWidth, fontFamily, fontScale, marginPx, markdown]);

  const drawLabel = useCallback(() => {
    const canvas = printCanvasRef.current;
    if (!canvas) return;
    renderContent(canvas.getContext('2d'), canvas.width, canvas.height, contentLeft);
  }, [contentLeft, renderContent]);

  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    renderContent(canvas.getContext('2d'), canvas.width, canvas.height, 0);
  }, [renderContent]);

  useEffect(() => {
    drawLabel();
    drawPreview();
  }, [contentHeight, feedHeight, drawLabel, drawPreview]);

  const drawRuler = useCallback(() => {
    const canvas = rulerCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, labelWidth, feedHeight);
    drawRulerTicks(context, labelWidth, feedHeight, { color: '#000000' });
  }, [feedHeight, labelWidth]);

  useEffect(() => {
    if (showRuler) drawRuler();
  }, [showRuler, drawRuler]);

  return {
    printCanvasRef,
    previewCanvasRef,
    rulerCanvasRef,
    drawLabel,
  };
}
