import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

describe('text label mode', () => {
  const context = {
    measureText: jest.fn((text) => ({ width: text.length * 8 })),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    strokeRect: jest.fn(),
    setLineDash: jest.fn(),
  };

  beforeEach(() => {
    context.measureText.mockImplementation((text) => ({ width: text.length * 8 }));
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('places the preview before the controls in 15mm continuous mode', () => {
    const { container } = render(<App />);

    fireEvent.change(screen.getByLabelText('Mode'), { target: { value: 'text' } });

    expect(
      container.querySelector('.app--continuous > .continuous-preview + .panel')
    ).toBeInTheDocument();
  });

  test('updates the live preview for normal orientation and the selected length', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Mode'), { target: { value: 'text' } });
    fireEvent.change(screen.getByLabelText('Text to print'), { target: { value: 'Hi' } });
    context.rotate.mockClear();
    context.drawImage.mockClear();

    fireEvent.change(screen.getByLabelText('Text orientation'), {
      target: { value: 'normal' },
    });
    fireEvent.change(screen.getByLabelText('Minimum label length (mm)'), {
      target: { value: '20' },
    });

    expect(screen.getByText('Calculated print length: 20.0 mm')).toBeInTheDocument();
    expect(context.drawImage).toHaveBeenCalled();
    expect(context.rotate).not.toHaveBeenCalled();
  });
});
