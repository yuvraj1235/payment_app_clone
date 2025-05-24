import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState ,useRef} from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View,ScrollView } from 'react-native';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const scrollViewRef = useRef(null);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const handleScroll = (event) => {
    const contentOffsetY = event.nativeEvent.contentOffset.y;
    // Open camera when scrolled down past 100 pixels
    if (contentOffsetY > 100 && !isCameraOpen) {
      setIsCameraOpen(true);
    }
    // Optionally, close camera if scrolled back up
    if (contentOffsetY <= 100 && isCameraOpen) {
      setIsCameraOpen(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    alert(`QR Code scanned! Type: ${type}, Data: ${data}`);
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollViewContent} // Add this for content styling
      >
        <View style={{ height: 500, backgroundColor: 'lightblue', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.text}>Scroll Down to Open Camera</Text>
        </View>

        <View style={{ height: 1500, backgroundColor: 'lightgreen', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.text}>Scroll further...</Text>
        </View>
      </ScrollView>

      {/* Show Camera when scrolled down, positioned absolutely */}
      {isCameraOpen && (
        <CameraView
          style={styles.overlayCamera} // Apply absolute positioning
          facing={facing}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} // Add QR code scanning
        >
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
            {scanned && (
              <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
                <Text style={styles.text}>Tap to Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Or any background color for the main view
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  scrollViewContent: {
    paddingBottom: 0, // Ensure no extra padding at the bottom of the scroll view
  },
  overlayCamera: {
    ...StyleSheet.absoluteFillObject, // This makes the camera absolute and fills the parent
    zIndex: 1, // Ensure camera is on top of the scroll view
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
    justifyContent: 'space-around', // Distribute buttons
    alignItems: 'flex-end', // Align buttons to the bottom
  },
  button: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});