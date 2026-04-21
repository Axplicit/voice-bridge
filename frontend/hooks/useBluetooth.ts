import { useState, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

const BT_CLASSIC_MODULE = 'react-native-bluetooth-classic';
const AUDIO_SESSION_MODULE = 'react-native-audio-session';

export type BluetoothDevice = {
  id: string;
  name: string;
};

export type BtConnectState = 'disconnected' | 'connecting' | 'connected' | 'error';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

async function requestAndroidPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const apiLevel = (Platform as any).Version ?? 0;
    if (apiLevel >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export function useBluetooth() {
  const [pairedDevices, setPairedDevices]         = useState<BluetoothDevice[]>([]);
  const [scannedDevices, setScannedDevices]       = useState<BluetoothDevice[]>([]);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [connectState, setConnectState]           = useState<BtConnectState>('disconnected');
  const [error, setError]                         = useState<string | null>(null);
  const [isLoading, setIsLoading]                 = useState(false);
  const [isScanning, setIsScanning]               = useState(false);
  const scanMap                                   = useRef<Record<string, boolean>>({});

  const fetchPairedDevices = useCallback(async () => {
    if (!isNative) {
      setError('Bluetooth is only available on iOS and Android (dev build required).');
      return;
    }
    const hasPermission = await requestAndroidPermissions();
    if (!hasPermission) {
      setError('Bluetooth permission denied. Please allow it in device settings.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const RNBluetoothClassic = require(BT_CLASSIC_MODULE).default;
      const bonded: any[] = await RNBluetoothClassic.getBondedDevices();
      const devices: BluetoothDevice[] = bonded
        .filter((d: any) => !!d.name)
        .map((d: any) => ({ id: d.address, name: d.name as string }));
      setPairedDevices(devices);
    } catch {
      setError('Could not load paired devices. Make sure you are using a dev/EAS build.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startScan = useCallback(async () => {
    if (!isNative) {
      setError('Scanning is only available on native builds.');
      return;
    }
    const hasPermission = await requestAndroidPermissions();
    if (!hasPermission) {
      setError('Bluetooth permission denied.');
      return;
    }
    setScannedDevices([]);
    scanMap.current = {};
    setIsScanning(true);
    setError(null);
    try {
      if (Platform.OS === 'android') {
        const RNBluetoothClassic = require(BT_CLASSIC_MODULE).default;
        const found: any[] = await RNBluetoothClassic.startDiscovery();
        const devices: BluetoothDevice[] = found
          .filter((d: any) => !!d.name)
          .map((d: any) => ({ id: d.address, name: d.name as string }));
        setScannedDevices(devices);
      } else {
        setError(
          'iOS does not allow scanning for new devices from within an app. ' +
          'Please pair your AirPods from Settings → Bluetooth first, then return here.'
        );
      }
    } catch (e: any) {
      setError('Scan failed: ' + (e?.message ?? 'unknown error'));
    } finally {
      setIsScanning(false);
    }
  }, []);

  const stopScan = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const RNBluetoothClassic = require(BT_CLASSIC_MODULE).default;
        await RNBluetoothClassic.cancelDiscovery();
      } catch {}
    }
    setIsScanning(false);
  }, []);

  const connectDevice = useCallback(async (deviceId: string) => {
    if (!isNative) return;
    setConnectState('connecting');
    setConnectedDeviceId(deviceId);
    setError(null);
    try {
      if (Platform.OS === 'ios') {
        const AudioSession = require(AUDIO_SESSION_MODULE).default;
        await AudioSession.setCategory('PlayAndRecord', [
          'AllowBluetooth',
          'AllowBluetoothA2DP',
          'DefaultToSpeaker',
        ]);
        await AudioSession.setActive(true);
      } else {
        const RNBluetoothClassic = require(BT_CLASSIC_MODULE).default;
        await RNBluetoothClassic.connectToDevice(deviceId);
      }
      setConnectState('connected');
    } catch (e: any) {
      setError('Could not connect: ' + (e?.message ?? 'unknown error'));
      setConnectState('error');
      setConnectedDeviceId(null);
    }
  }, []);

  const disconnectDevice = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        const AudioSession = require(AUDIO_SESSION_MODULE).default;
        await AudioSession.setCategory('SoloAmbient', []);
      } else if (connectedDeviceId) {
        const RNBluetoothClassic = require(BT_CLASSIC_MODULE).default;
        try { await RNBluetoothClassic.disconnectFromDevice(connectedDeviceId); } catch {}
      }
    } catch {}
    setConnectedDeviceId(null);
    setConnectState('disconnected');
  }, [connectedDeviceId]);

  return {
    pairedDevices,
    scannedDevices,
    connectedDeviceId,
    connectState,
    error,
    isLoading,
    isScanning,
    fetchPairedDevices,
    startScan,
    stopScan,
    connectDevice,
    disconnectDevice,
  };
}
