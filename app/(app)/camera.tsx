import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useNavigation } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

type RootStackParamList = {
  goBack(): void;
  navigate(arg0: string, arg1: { recipientUid: string; }): unknown;
  mypage: undefined;
  Camera: undefined;
  Payment: { recipientUid: string };
};

const Camera = () => {
  const navigation = useNavigation<RootStackParamList>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'torch'>('off');
  const [cameraKey, setCameraKey] = useState(0); // New state to force CameraView remount

  // Reset scanned state and force camera remount when the screen comes into focus
  useEffect(() => {
    if (isFocused) {
      setScanned(false);
      setCameraKey(prevKey => prevKey + 1); // Change key to force remount
    }
  }, [isFocused]);

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#009688" />
        <Text style={styles.permissionMessage}>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="videocam-off" size={60} color="#009688" style={styles.permissionIcon} />
        <Text style={styles.permissionMessage}>
          We need your permission to access the camera for QR code scanning.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permissionButtonSecondary} onPress={() => navigation.goBack()}>
          <Text style={styles.permissionButtonTextSecondary}>Go Back</Text>
        </TouchableOpacity>
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.permissionButtonSecondary} onPress={() => Linking.openURL('app-settings:')}>
            <Text style={styles.permissionButtonTextSecondary}>Open App Settings</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    setScanned(true); // Disable further scans immediately
    Alert.alert(
      "QR Code Scanned",
      `Scanned data: ${data}`,
      [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate('Payment', { recipientUid: data });
            // 'scanned' state will be reset by useIsFocused when returning to this screen.
            // No explicit setScanned(false) here to avoid race conditions with navigation.
          }
        },
        {
          text: "Scan Again",
          onPress: () => setScanned(false) // Allow rescanning
        }
      ],
      { cancelable: false }
    );
  };

  const toggleFlash = () => {
    setFlashMode(current => (current === 'off' ? 'torch' : 'off'));
  };

  const handleShowMyQrCode = () => {
   router.push('/myqr')  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Conditionally render CameraView only when the screen is focused */}
      {isFocused && (
        <CameraView
          key={cameraKey} // This key ensures the component remounts
          style={styles.camera}
          facing={'back'}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          enableTorch={flashMode === 'torch'}
        >
          {/* Header Overlay */}
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <MaterialIcons name="arrow-back" size={28} color="#004D40" />
            </TouchableOpacity>
            <Text style={styles.title}>Scan QR Code</Text>
            {/* Placeholder for alignment or future action */}
            <View style={{ width: 44 }} />
          </View>

          {/* QR Scanning Frame */}
          <View style={styles.qrFrameContainer}>
            <View style={styles.qrBox} />
            <Text style={styles.scanInstructionText}>Align QR code within the frame</Text>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity onPress={toggleFlash} style={styles.controlButton}>
              <MaterialIcons name={flashMode === 'torch' ? 'flashlight-on' : 'flashlight-off'} size={30} color="#FFF" />
              <Text style={styles.controlButtonText}>Flash</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShowMyQrCode} style={styles.controlButton}>
              <MaterialIcons name="qr-code-2" size={30} color="#FFF" />
              <Text style={styles.controlButtonText}>My QR Code</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}

      {/* "Scan Again" button - only visible after a scan */}
      {scanned && (
        <TouchableOpacity style={styles.scanAgainButton} onPress={() => setScanned(false)}>
          <Text style={styles.scanAgainButtonText}>Scan Another QR Code</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for camera screen
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between', // Distribute content vertically
    alignItems: 'center', // Center content horizontally
  },
  headerOverlay: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.4)', // Semi-transparent dark background for header
    position: 'absolute', // Ensures it floats over the camera feed
    top: 0,
    zIndex: 10, // Make sure it's on top
  },
  closeButton: {
    padding: 10,
    borderRadius: 25,
    // No background needed, let headerOverlay handle it
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  qrFrameContainer: {
    flex: 1, // Allows this section to take available vertical space
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80, // Push QR box slightly up from center to make space for bottom controls
  },
  qrBox: {
    width: screenWidth * 0.7, // 70% of screen width
    height: screenWidth * 0.7, // Maintain aspect ratio
    borderColor: '#009688', // Vibrant green border
    borderWidth: 3, // Thicker border
    borderRadius: 15, // Rounded corners for the frame
    backgroundColor: 'transparent', // Transparent inside
    overflow: 'hidden', // Ensures anything inside is clipped
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanInstructionText: {
    color: '#FFF',
    fontSize: 15,
    marginTop: 20, // Space below QR box
    backgroundColor: 'rgba(0,0,0,0.3)', // Slight background for readability
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  bottomControls: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 25, // More vertical padding
    backgroundColor: 'rgba(0,0,0,0.4)', // Semi-transparent dark background for controls
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 15, // Rounded button containers
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 13,
    marginTop: 5,
    fontWeight: '500',
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 100, // Position above the bottom nav (if any) or from screen bottom
    alignSelf: 'center',
    backgroundColor: '#009688', // Primary green button
    paddingVertical: 14, // Larger touch area
    paddingHorizontal: 30, // Wider button
    borderRadius: 30, // Pill shape
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 11, // Ensure it's above other content
  },
  scanAgainButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Permission screen styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E0F2F1', // Light background matching app theme
  },
  permissionIcon: {
    marginBottom: 20,
  },
  permissionMessage: {
    color: '#004D40',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 25,
  },
  permissionButton: {
    backgroundColor: '#009688',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  permissionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  permissionButtonSecondary: {
    borderColor: '#009688',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  permissionButtonTextSecondary: {
    color: '#00695C',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default Camera;