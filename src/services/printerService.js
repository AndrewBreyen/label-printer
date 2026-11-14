import { PrintPort } from 'marklife-label-printer-web-kit';
import { isNativeIOS, openPrinterConnection } from './printerConnection';

const SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
const WRITE_CHAR_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';
const CREDIT_CHAR_UUID = '0000ff03-0000-1000-8000-00805f9b34fb'; // credit grants
const STATUS_CHAR_UUID = '0000ff01-0000-1000-8000-00805f9b34fb';

const CHUNK_SIZE = 90; // README: "Automatically splits data into optimal chunks (90 bytes)"
export const REQUIRED_IMAGE_WIDTH = 384; // README: "P50S Specifics: enforces a 384px width"
const PRINT_SPEED = 0; // SDK: 0 = low, 1 = medium, 2 = high

let state = null;

export { isNativeIOS };

export async function connectPrinter(onDisconnect = () => {}) {
  if (state) throw new Error('A printer connection is already open or in progress.');

  const session = { connection: null, credit: 0 };
  state = session;
  try {
    session.connection = await openPrinterConnection({
      service: SERVICE_UUID,
      write: WRITE_CHAR_UUID,
      credit: CREDIT_CHAR_UUID,
      status: STATUS_CHAR_UUID,
      chunkSize: CHUNK_SIZE,
      onCredit(bytes) {
        if (bytes.length >= 2 && bytes[0] === 0x01) {
          // A grant of four resets the printer's credit window.
          session.credit = bytes[1] === 4 ? 4 : session.credit + bytes[1];
        }
      },
      onStatus: (bytes) => console.log('[printer] notify (ff01):', bytes),
      onDisconnect() {
        if (state === session) {
          state = null;
          onDisconnect();
        }
      },
    });
    if (state !== session) throw new Error('Printer disconnected during setup.');
    return session.connection.device;
  } catch (error) {
    if (state === session) state = null;
    throw error;
  }
}

export async function disconnectPrinter() {
  const session = state;
  if (!session?.connection) return;
  await session.connection.disconnect();
  if (state === session) state = null;
}

export function isPrinterConnected() {
  return Boolean(state?.connection);
}

function toUint8Array(bufferLike) {
  if (bufferLike instanceof Uint8Array) return bufferLike;
  if (bufferLike instanceof ArrayBuffer) return new Uint8Array(bufferLike);
  return new Uint8Array(bufferLike);
}

function concatBuffers(buffers) {
  const parts = buffers.map(toUint8Array);
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/**
 * Sends a buffer in credit-paced, fixed-size chunks, per the
 * printer's flow-control protocol. Includes the small inter-chunk
 * delay used by the reference handler — without it, chunks can be
 * written faster than the printer's BLE stack/firmware can absorb
 * them, corrupting the print (this turned out to matter more than
 * any calibration step).
 */
async function sendPaced(session, bufferLike) {
  let bytes = toUint8Array(bufferLike);
  console.log('[printer] sending', bytes.length, 'bytes...');

  while (bytes.length > 0) {
    let waited = 0;
    while (state === session && session.credit <= 0) {
      await new Promise((resolve) => setTimeout(resolve, 15));
      waited += 15;
      if (waited > 5000) {
        throw new Error(
          'Timed out waiting for printer credit — the connection may be in a stuck state. Try Disconnect, then Connect again.'
        );
      }
    }

    if (state !== session) throw new Error('Printer disconnected mid-transfer.');

    const size = Math.min(CHUNK_SIZE, bytes.length);
    const chunk = bytes.slice(0, size);
    session.credit -= 1;
    await session.connection.write(chunk);
    bytes = bytes.slice(size);

    // Mandatory pacing delay, matching the reference handler exactly.
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  console.log('[printer] send complete.');
}

/**
 * Renders the given canvas to the printer. The canvas MUST be
 * exactly `REQUIRED_IMAGE_WIDTH` (384) px wide — see that export.
 * Height is flexible and determines the physical label length.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ paperType?: number }} options
 *   paperType: 0x10 continuous / 0x20 gap label / 0x30 black mark
 */
export async function printLabel(canvas, options = {}) {
  const session = state;
  if (!session?.connection) throw new Error('Printer is not connected.');

  if (canvas.width !== REQUIRED_IMAGE_WIDTH) {
    throw new Error(
      `Canvas must be ${REQUIRED_IMAGE_WIDTH}px wide for P50S firmware compatibility (got ${canvas.width}px).`
    );
  }

  const paperType = options.paperType ?? 0x10; // continuous roll

  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  console.log('[printer] processing image...');
  const printBuffer = await PrintPort.processImageData({
    data: imageData.data,
    width: canvas.width,
    height: canvas.height,
  });

  // Configuration commands must be sent outside the print-job payload.
  // Sending setSpeed alongside startPrintjob causes some firmware versions
  // to ignore the setting and retain the previous speed.
  await sendPaced(session, PrintPort.setSpeed(PRINT_SPEED));
  await new Promise((resolve) => setTimeout(resolve, 100));

  // README "Method 2: Advanced Usage" — one concatenated payload,
  // sent as a single paced/chunked stream.
  const payload = concatBuffers([
    PrintPort.setPaperType(paperType),
    PrintPort.startPrintjob(),
    PrintPort.alignPaperStart(),
    printBuffer,
    PrintPort.stopPrintjob(),
    PrintPort.alignPaperEnd(),
  ]);

  await sendPaced(session, payload);
  console.log('[printer] print job complete.');
}

/**
 * Sends an arbitrary raw byte sequence directly, for interactive
 * debugging from the browser console via window.printerDebug.
 */
export async function sendRawCommand(bytes) {
  if (!state?.connection) throw new Error('Printer is not connected.');
  await state.connection.write(new Uint8Array(bytes));
}

/**
 * Manual paper alignment — for when physical drift happens (paper
 * reload, slip, etc.) rather than an automatic "learn the gap"
 * routine. The reference implementation doesn't have an automatic
 * calibration step at all (gap-sensing is handled by the printer's
 * own hardware), so this instead exposes the two position commands
 * we KNOW are real and working, since they're the exact commands
 * already used inside printLabel()'s own payload:
 *   - alignPaperStart(): snaps to the top of the current/next label.
 *   - adjustPosition(mode, distanceMm): fine nudge forward/backward.
 *
 * @param {'forward'|'backward'} direction
 * @param {number} distanceMm small nudge distance in mm (default 2)
 */
export async function nudgePaper(direction, distanceMm = 2) {
  if (!state?.connection) throw new Error('Printer is not connected.');
  const mode = direction === 'forward' ? 0x01 : 0x11; // mm units, per printer-commands.js docstring
  await sendRawCommand(Array.from(toUint8Array(PrintPort.adjustPosition(mode, distanceMm))));
}

/** Snaps the paper back to the start of the current/next label. */
export async function alignToLabelStart() {
  if (!state?.connection) throw new Error('Printer is not connected.');
  await sendRawCommand(Array.from(toUint8Array(PrintPort.alignPaperStart())));
}

if (typeof window !== 'undefined') {
  window.printerDebug = {
    raw: (bytes) => sendRawCommand(bytes),
    isConnected: isPrinterConnected,
  };
}