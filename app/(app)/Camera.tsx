import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image, Button, ScrollView } from 'react-native';
import React from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { useNavigation } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Camera = () => {
    const navigation = useNavigation();
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [scanned, setScanned] = useState(false);
    const scrollViewRef = useRef(null);
    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }
    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        alert(`QR Code scanned! Type: ${type}, Data: ${data}`);
    };
    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }
    return (

        <CameraView
            style={styles.overlayCamera} // Apply absolute positioning
            facing={facing}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} // Add QR code scanning
        >
            <View style={styles.cameraButtonContainer}>
                <TouchableOpacity style={styles.cameraButton} onPress={toggleCameraFacing}>
                    <Text style={styles.cameraButtonText}>Flip Camera</Text>
                </TouchableOpacity>
                {scanned && (
                    <TouchableOpacity style={styles.cameraButton} onPress={() => setScanned(false)}>
                        <Text style={styles.cameraButtonText}>Tap to Scan Again</Text>
                    </TouchableOpacity>
                )}
            </View>
        </CameraView>

    )
}
const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    paddingTop: 50,
  },
  profileIcon: {
    borderRadius: 100,
    height: 50,
    width: 50,
    alignSelf: 'flex-end',
    margin: 10,
  },
  headingText: {
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'white',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    fontSize: 20,
  },
  contentAndCameraWrapper: {
    flex: 1, 
    position: 'relative',
    borderWidth: 4,
    borderColor: '#290551',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden', 
    marginTop:200
  },
  scrollViewStyle: {
    flex: 1, 
  },
  scrollViewContent: {
   
    paddingBottom: 20,
  
  },
  scrollableSection: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: 20,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  iconButton: {
    alignItems: 'center',
    width: '45%',
  },
  icon: {
    paddingHorizontal: 10,
  },
  iconText: {
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'white',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    fontSize: 16,
  },
  overlayCamera: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    borderRadius: 16, 
  },
  cameraButtonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  cameraButton: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
  },
  cameraButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  container: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  message: { 
    textAlign: 'center',
    paddingBottom: 10,
    color: '#000',
  },
  text: { 
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});
export default Camera