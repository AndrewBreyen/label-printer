import { generateTextCanvas } from '../utils/textLabelUtils';

describe('generateTextCanvas', () => {
  const context = {
    measureText: jest.fn((text) => ({ width: text.length * 10 })),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    scale: jest.fn(),
    restore: jest.fn(),
  };

  beforeEach(() => {
    context.measureText.mockImplementation((text) => ({ width: text.length * 10 }));
    jest.spyOn(document, 'createElement').mockImplementation(() => ({
      width: 0,
      height: 0,
      getContext: () => context,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('sizes rotated text to the widest line and places it at the label start', () => {
    const canvas = generateTextCanvas('# Hi\n## There', { minimumLengthMm: 8 });

    expect(canvas.width).toBe(70);
    expect(canvas.height).toBe(120);
    expect(context.fillText).toHaveBeenNthCalledWith(1, 'Hi', 10, 31, 50);
    expect(context.fillText).toHaveBeenNthCalledWith(2, 'There', 10, 66.5, 50);
  });

  test('uses the minimum length when it is longer than the content', () => {
    const canvas = generateTextCanvas('Hi', { minimumLengthMm: 20 });

    expect(canvas.width).toBe(160);
    expect(canvas.height).toBe(120);
    expect(context.fillText).toHaveBeenCalledWith('Hi', 10, 21.5, 140);
  });

  test('renders normal text without rotating and uses label length as canvas height', () => {
    const canvas = generateTextCanvas('Hello', {
      orientation: 'normal',
      minimumLengthMm: 15,
    });

    expect(canvas.width).toBe(120);
    expect(canvas.height).toBe(120);
    expect(context.fillText).toHaveBeenCalledWith('Hello', 60, 21.5, 100);
  });

  test('supports centered and end alignment on the label length', () => {
    generateTextCanvas('Hi', { orientation: 'normal', minimumLengthMm: 20, alignment: 'center' });
    expect(context.fillText).toHaveBeenCalledWith('Hi', 60, 80, 100);

    generateTextCanvas('Hi', { orientation: 'normal', minimumLengthMm: 20, alignment: 'end' });
    expect(context.fillText).toHaveBeenCalledWith('Hi', 60, 138.5, 100);
  });

  test('aligns rotated text across the tape width', () => {
    generateTextCanvas('Hi', { minimumLengthMm: 20, alignment: 'center' });
    expect(context.fillText).toHaveBeenCalledWith('Hi', 10, 60, 140);

    generateTextCanvas('Hi', { minimumLengthMm: 20, alignment: 'end' });
    expect(context.fillText).toHaveBeenCalledWith('Hi', 10, 98.5, 140);
  });

  test('applies the selected font scale and allows zero margins', () => {
    const canvas = generateTextCanvas('# Hi', {
      fontFamily: 'serif',
      fontScale: 1.25,
      marginMm: 0,
    });

    expect(canvas.width).toBe(64);
    expect(context.font).toBe('bold 40px serif');
    expect(context.fillText).toHaveBeenCalledWith('Hi', 0, 26, 64);
  });

  test('rejects margins that leave no room for text', () => {
    expect(() => generateTextCanvas('Hi', { marginMm: 7.5 })).toThrow(
      'Margins must be non-negative and leave room for text.'
    );
  });

  test('rejects whitespace-only text', () => {
    expect(() => generateTextCanvas('   ')).toThrow('Enter text to print.');
  });

  test('scales multiple markdown lines to fit the tape width', () => {
    generateTextCanvas('# One\n# Two\n# Three', { minimumLengthMm: 8 });

    expect(context.scale).toHaveBeenCalledWith(1, 120 / 126);
  });

  test('rejects invalid label lengths', () => {
    expect(() => generateTextCanvas('Hi', { minimumLengthMm: 1 })).toThrow(
      'Minimum label length must be between 8 and 1000 mm.'
    );
  });
});
