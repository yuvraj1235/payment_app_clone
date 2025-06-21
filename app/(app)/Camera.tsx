import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type RootStackParamList = {
  mypage: undefined;
  Camera: undefined;
  Payment: { recipientUid: string };
};

const Camera = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState('off');

  if (!permission) return <View style={styles.permissionContainer} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionMessage}>We need camera permission to scan QR codes.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permissionButtonSecondary} onPress={() => navigation.goBack()}>
          <Text style={styles.permissionButtonTextSecondary}>Go Back</Text>
        </TouchableOpacity>
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.permissionButtonSecondary} onPress={() => Linking.openURL('app-settings:')}>
            <Text style={styles.permissionButtonTextSecondary}>Open Settings</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    navigation.navigate('Payment', { recipientUid: data });
  };

  const toggleFlash = () => {
    setFlashMode(current => (current === 'off' ? 'torch' : 'off'));
  };

  const handleShowMyQrCode = () => {
    Alert.alert('Coming Soon', 'This will show your personal QR code.');
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={'back'}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        enableTorch={flashMode === 'torch'}
      >
        <View style={styles.overlayTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <MaterialIcons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan QR Code</Text>
        </View>

        <View style={styles.qrBox} />

        <View style={styles.overlayBottom}>
          <TouchableOpacity onPress={toggleFlash} style={styles.iconButton}>
            <MaterialIcons name={flashMode === 'torch' ? 'flashlight-on' : 'flashlight-off'} size={28} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShowMyQrCode} style={styles.qrButton}>
            <Text style={styles.qrButtonText}>My QR Code</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
      {scanned && (
        <TouchableOpacity style={styles.scanAgain} onPress={() => setScanned(false)}>
          <Text style={styles.scanAgainText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlayTop: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  qrBox: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginTop: 160,
    borderColor: '#00FFC6',
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
  },
  qrButton: {
    backgroundColor: '#00FFD5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  qrButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scanAgain: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#00FFD5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  scanAgainText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1E1E1E'
  },
  permissionMessage: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  permissionButton: {
    backgroundColor: '#00FFD5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  permissionButtonText: {
    color: '#000',
    fontWeight: 'bold'
  },
  permissionButtonSecondary: {
    borderColor: '#888',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  permissionButtonTextSecondary: {
    color: '#888',
    fontSize: 14,
  },
});

export default Camera;