import { Capacitor } from '@capacitor/core';

export const isNativeIOS = Capacitor.getPlatform() === 'ios' && Capacitor.isNativePlatform();

function notificationBytes(value) {
  return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
}

async function openWebConnection(options) {
  if (!navigator.bluetooth) {
    throw new Error(
      'Web Bluetooth is not available in this browser. Use Chrome or Edge over HTTPS (or localhost).'
    );
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [
      { namePrefix: 'P50' },
      { namePrefix: 'Marklife' },
      { namePrefix: 'Printer' },
    ],
    optionalServices: [options.service],
  });
  const listeners = new AbortController();
  const disconnect = () => {
    listeners.abort();
    if (device.gatt.connected) device.gatt.disconnect();
  };
  device.addEventListener('gattserverdisconnected', () => {
    listeners.abort();
    options.onDisconnect();
  }, { signal: listeners.signal });

  try {
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(options.service);
    const write = await service.getCharacteristic(options.write);
    for (const [uuid, callback] of [
      [options.credit, options.onCredit],
      [options.status, options.onStatus],
    ]) {
      const characteristic = await service.getCharacteristic(uuid);
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        callback(notificationBytes(event.target.value));
      }, { signal: listeners.signal });
      await characteristic.startNotifications();
    }
    return { device, disconnect, write: (bytes) => write.writeValueWithoutResponse(bytes) };
  } catch (error) {
    disconnect();
    throw error;
  }
}

async function openIOSConnection(options) {
  const { BleClient } = await import('@capacitor-community/bluetooth-le');
  await BleClient.initialize();
  const device = await BleClient.requestDevice({
    name: 'P50S-1776_BLE',
    optionalServices: [options.service],
  });
  const { deviceId } = device;

  try {
    await BleClient.connect(deviceId, options.onDisconnect);
    const mtu = await BleClient.getMtu(deviceId);
    if (mtu - 3 < options.chunkSize) {
      throw new Error('The Bluetooth connection cannot send the printer’s required 90-byte packets.');
    }
    await BleClient.startNotifications(deviceId, options.service, options.credit, (value) => {
      options.onCredit(notificationBytes(value));
    });
    await BleClient.startNotifications(deviceId, options.service, options.status, (value) => {
      options.onStatus(notificationBytes(value));
    });
    return {
      device,
      disconnect: () => BleClient.disconnect(deviceId),
      write: (bytes) => BleClient.writeWithoutResponse(
        deviceId,
        options.service,
        options.write,
        new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      ),
    };
  } catch (error) {
    await BleClient.disconnect(deviceId).catch(() => {});
    throw error;
  }
}

export function openPrinterConnection(options) {
  return isNativeIOS ? openIOSConnection(options) : openWebConnection(options);
}
