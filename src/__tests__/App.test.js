import { fireEvent, render, screen } from '@testing-library/react';
import App from '../features/labelPrinter/App';

describe('text label mode', () => {
  const context = {
    measureText: jest.fn((text) => ({ width: text.length * 8 })),
    clearRect: jest.fn(),
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
    localStorage.clear();
    context.measureText.mockImplementation((text) => ({ width: text.length * 8 }));
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  const selectMode = (groupName, modeName) => {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(groupName, 'i') }));
    fireEvent.click(screen.getByRole('button', { name: modeName }));
  };

  test('groups label types by stock size and keeps the selected type', () => {
    const { container } = render(<App />);

    selectMode('15 mm continuous', 'Barcode');

    expect(container.querySelector('.mode-tab.is-selected')).toHaveTextContent('Barcode');
    expect(screen.getByLabelText(/Value to encode \(CODE128\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Text' })).toBeInTheDocument();
    expect(
      Array.from(container.querySelectorAll('.mode-tab')).map((tab) => tab.textContent)
    ).toEqual(['Text', 'Barcode', 'Prep label']);
  });

  test('keeps connection controls at the top and the floating print action separate', () => {
    const { container } = render(<App />);
    const header = container.querySelector('.app-header');
    const toolbar = container.querySelector('.printer-toolbar');

    expect(header.nextElementSibling).toBe(toolbar);
    expect(toolbar.nextElementSibling).toHaveClass('stock-groups');
    const printButton = screen.getByRole('button', { name: 'Print Label' });
    const connectButton = screen.getByRole('button', { name: 'Connect Printer' });
    expect(toolbar).toContainElement(connectButton);
    expect(connectButton).toBeEnabled();
    expect(printButton.parentElement).toHaveClass('floating-print');
    expect(printButton).toBeDisabled();
    const printTestButton = screen.getByRole('button', { name: 'Print ruler test' });
    expect(toolbar).not.toContainElement(printTestButton);
    expect(printTestButton).toBeDisabled();
    expect(printTestButton.parentElement).toHaveClass('app-footer');
  });

  test('keeps templates inside custom labels and exposes prep and image workflows by size', () => {
    render(<App />);

    expect(screen.queryByRole('button', { name: 'Templates' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Start from a template')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Start from a template'), {
      target: { value: 'code:Simple Label' },
    });
    expect(screen.getByDisplayValue('# Hello World')).toBeInTheDocument();

    selectMode('Small labels', 'Prep label');
    expect(screen.getByLabelText('Item name')).toBeInTheDocument();

    selectMode('58 mm continuous', 'Image');
    expect(screen.getByLabelText('Image to print')).toBeInTheDocument();
  });

  test('reuses prep controls for a 15mm continuous label', () => {
    const { container } = render(<App />);

    selectMode('15 mm continuous', 'Prep label');

    expect(screen.getByLabelText('Item name')).toBeInTheDocument();
    expect(screen.getByLabelText('Use by date')).toBeInTheDocument();
    const previewCanvas = container.querySelector('.preview canvas');
    expect(previewCanvas).toHaveAttribute('width', '120');
    expect(Number(previewCanvas.getAttribute('height'))).toBeGreaterThan(0);
    expect(screen.getByText(/\d+\.\d mm/, { selector: '.preview-length' })).toBeInTheDocument();
    expect(context.fillText).toHaveBeenCalledWith('PREP', expect.any(Number), expect.any(Number), 100);
    expect(context.fillText).toHaveBeenCalledWith('USE BY', expect.any(Number), expect.any(Number), 100);
  });

  test('applies and resets the fit-content minimum for 15mm prep labels', () => {
    const { container } = render(<App />);
    selectMode('15 mm continuous', 'Prep label');

    const lengthInput = screen.getByLabelText('Minimum label length (mm)');
    const previewCanvas = container.querySelector('.preview canvas');
    const naturalHeight = Number(previewCanvas.getAttribute('height'));
    const naturalLength = Number(lengthInput.value);

    fireEvent.change(lengthInput, { target: { value: '' } });
    expect(lengthInput).toHaveValue(null);
    fireEvent.change(lengthInput, { target: { value: '80' } });
    expect(previewCanvas).toHaveAttribute('height', '640');
    expect(container.querySelectorAll('canvas')[1]).toHaveAttribute('height', '640');
    expect(screen.getByText('80.0 mm', { selector: '.preview-length' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fit content' }));
    expect(previewCanvas).toHaveAttribute('height', String(naturalHeight));
    expect(lengthInput).toHaveValue(naturalLength);
  });

  test('applies and resets the fit-content minimum for 15mm barcodes', () => {
    const { container } = render(<App />);
    selectMode('15 mm continuous', 'Barcode');
    fireEvent.change(screen.getByLabelText(/Value to encode \(CODE128\)/), {
      target: { value: '12' },
    });

    const lengthInput = screen.getByLabelText('Minimum label length (mm)');
    const previewCanvas = container.querySelector('.continuous-preview canvas');
    const naturalHeight = Number(previewCanvas.getAttribute('height'));
    const naturalLength = Number(lengthInput.value);

    fireEvent.change(lengthInput, { target: { value: '25' } });
    expect(previewCanvas).toHaveAttribute('height', '200');
    expect(container.querySelectorAll('canvas')[2]).toHaveAttribute('height', '200');
    expect(screen.getByText('25 mm', { selector: '.preview-length' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fit content' }));
    expect(previewCanvas).toHaveAttribute('height', String(naturalHeight));
    expect(lengthInput).toHaveValue(naturalLength);
  });

  test('starts with default text rendered in the 15mm preview', () => {
    const { container } = render(<App />);

    selectMode('15 mm continuous', 'Text');

    expect(screen.getByLabelText('Text to print')).toHaveValue('# Hello World');
    expect(screen.getByRole('button', { name: 'Vertical' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Alignment across label width')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toHaveAttribute('aria-pressed', 'true');
    const previewCanvas = container.querySelector('.continuous-preview canvas');
    expect(previewCanvas).toHaveAttribute('width', '120');
    expect(previewCanvas).toHaveAttribute('height', '108');
  });

  test('applies font size and margin settings to the live text preview', () => {
    render(<App />);
    selectMode('15 mm continuous', 'Text');

    fireEvent.change(screen.getByLabelText('Text font'), { target: { value: 'serif' } });
    fireEvent.change(screen.getByLabelText('Text size'), { target: { value: 'large' } });
    fireEvent.click(screen.getByRole('button', { name: 'No margins' }));

    expect(screen.getByLabelText('Margins in millimeters')).toHaveValue('0');
    expect(context.font).toBe('bold 40px serif');
    expect(context.fillText).toHaveBeenCalledWith('Hello World', 0, 26, 88);
  });

  test('saves font, size, and margin settings with a content template', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Text font'), { target: { value: 'serif' } });
    fireEvent.change(screen.getByLabelText('Text size'), { target: { value: 'large' } });
    fireEvent.click(screen.getByRole('button', { name: 'No margins' }));
    fireEvent.change(screen.getByPlaceholderText('Template name'), {
      target: { value: 'Styled label' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    fireEvent.change(screen.getByLabelText('Text font'), { target: { value: 'sans-serif' } });
    fireEvent.change(screen.getByLabelText('Text size'), { target: { value: 'small' } });
    fireEvent.change(screen.getByLabelText('Start from a template'), {
      target: { value: 'saved:Styled label' },
    });

    expect(screen.getByLabelText('Text font')).toHaveValue('serif');
    expect(screen.getByLabelText('Text size')).toHaveValue('large');
    expect(screen.getByLabelText('Margins in millimeters')).toHaveValue('0');
  });

  test('updates the live preview for horizontal orientation and the selected length', () => {
    const { container } = render(<App />);

    selectMode('15 mm continuous', 'Text');
    const textToolbar = container.querySelector('.text-toolbar');
    expect(container.querySelector('.panel').firstElementChild).toBe(textToolbar);
    expect(textToolbar.querySelectorAll('.text-toolbar-control')).toHaveLength(2);
    expect(container.querySelector('.panel-heading')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Text to print'), { target: { value: 'Hi' } });
    context.rotate.mockClear();
    context.drawImage.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Horizontal' }));
    const lengthInput = screen.getByLabelText('Minimum label length (mm)');
    const previewCanvas = container.querySelector('.continuous-preview canvas');
    const naturalHeight = Number(previewCanvas.getAttribute('height'));
    const naturalLength = Number(lengthInput.value);
    expect(naturalLength).toBeGreaterThan(0);
    expect(previewCanvas).toHaveAttribute('height', String(naturalHeight));
    expect(container.querySelector('.preview-length')).toHaveTextContent(`${naturalLength} mm`);
    fireEvent.change(screen.getByLabelText('Minimum label length (mm)'), {
      target: { value: '20' },
    });

    expect(screen.getByRole('button', { name: 'Horizontal' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByText('Alignment along label length')).toBeInTheDocument();
    expect(container.querySelector('.preview-length')).toHaveTextContent('20 mm');
    expect(previewCanvas).toHaveAttribute('height', '160');
    expect(container.querySelectorAll('canvas')[3]).toHaveAttribute('height', '160');
    expect(context.drawImage).toHaveBeenCalled();
    expect(context.rotate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Fit content' }));
    expect(previewCanvas).toHaveAttribute('height', String(naturalHeight));
    expect(lengthInput).toHaveValue(naturalLength);
  });
});
