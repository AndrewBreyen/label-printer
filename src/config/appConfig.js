// Shared mode and typography defaults.
export const STOCK_GROUPS = [
  {
    id: 'small',
    title: 'Small labels',
    description: 'Die-cut labels in multiple sizes',
    modes: [
      { id: 'manual', label: 'Custom label' },
      { id: 'prep', label: 'Prep label' },
    ],
  },
  {
    id: 'receipt58',
    title: '58 mm continuous',
    description: 'Receipt paper and full-width images',
    modes: [
      { id: 'receipt', label: 'Receipt' },
      { id: 'image', label: 'Image' },
    ],
  },
  {
    id: 'continuous15',
    title: '15 mm continuous',
    description: 'Narrow tape for text and barcodes',
    modes: [
      { id: 'text', label: 'Text' },
      { id: 'barcode', label: 'Barcode' },
    ],
  },
];

export const MODE_STOCK_GROUP = {
  manual: 'small',
  prep: 'small',
  receipt: 'receipt58',
  image: 'receipt58',
  text: 'continuous15',
  barcode: 'continuous15',
};

export const FONT_OPTIONS = [
  { value: 'sans-serif', label: 'Sans serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
];

export const TEXT_SIZE_SCALES = {
  small: 0.8,
  standard: 1,
  large: 1.25,
};

export const DEFAULT_MARGIN_MM = 1.25;
export const MAX_MARGIN_MM = 5;
