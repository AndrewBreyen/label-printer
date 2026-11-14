import React from 'react';

export default function PreviewCanvas({
  mode,
  imageLoaded,
  imageHeight,
  labelWidth,
  tapeWidth,
  contentWidth,
  contentHeight,
  imageRef,
  barcodeRef,
  textRef,
  labelRef,
}) {
  if (mode === 'image' && !imageLoaded) return null;

  if (mode === 'image') {
    return (
      <div className="preview">
        <canvas
          ref={imageRef}
          width={labelWidth}
          height={imageHeight}
          className="label-canvas"
        />
      </div>
    );
  }

  if (mode === 'barcode' || mode === 'text') {
    return (
      <div className="preview continuous-preview">
        <canvas
          ref={mode === 'barcode' ? barcodeRef : textRef}
          width={tapeWidth}
          height={1}
          className="label-canvas"
        />
      </div>
    );
  }

  return (
    <div className="preview">
      <canvas
        ref={labelRef}
        width={contentWidth}
        height={contentHeight}
        className="label-canvas"
      />
    </div>
  );
}
