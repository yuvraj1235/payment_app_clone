import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image, Button, ScrollView } from 'react-native';
import React from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { useNavigation } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Home = () => {
  const navigation = useNavigation();
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
    // Open camera when scrolled down past a certain threshold
    // The threshold should be relative to the scrollable content.
    // Let's say we want it to open after scrolling past the initial blue section.
    const cameraOpenThreshold = 100; // Adjust as needed
    if (contentOffsetY > cameraOpenThreshold && !isCameraOpen) {
      setIsCameraOpen(true);
    }
    // Close camera if scrolled back up above the threshold
    if (contentOffsetY <= cameraOpenThreshold && isCameraOpen) {
      setIsCameraOpen(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    alert(`QR Code scanned! Type: ${type}, Data: ${data}`);
    // You might want to navigate or perform other actions here
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <ImageBackground source={require('../../assets/images/background.jpg')} resizeMode="cover" style={styles.imageBackground}>
      {/* Header content */}
     <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollViewContent}
          style={styles.scrollViewStyle}
        >
      <TouchableOpacity onPress={() => console.log('Profile icon pressed')} >
        <Image style={styles.profileIcon} source={require('../../assets/images/google.png')} />
      </TouchableOpacity>

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={styles.headingText}>SCROLL DOWN TO SCAN</Text>
        <MaterialIcons name='keyboard-double-arrow-down' size={70}
          color="#ccc"
          style={{ paddingHorizontal: 10 }} />
      </View>

      {/* This is the container for the scrollable content */}
      <View style={styles.contentAndCameraWrapper}>
        
          {/* A dummy view to push down the content and allow scrolling */}
          <View style={{  justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
    
          </View>

          {/* Your actual scrollable icons and content */}
          <View style={styles.scrollableSection}>
            <View style={styles.iconRow}>
              <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Scan pressed')}>
                <MaterialIcons name='qr-code-scanner' size={70}
                  color="#ccc"
                  style={styles.icon} />
                <Text style={styles.iconText}>SCAN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Pay Contact pressed')}>
                <MaterialIcons name='connect-without-contact' size={70}
                  color="#ccc"
                  style={styles.icon} />
                <Text style={styles.iconText}>PAY CONTACT</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.iconRow}>
              <TouchableOpacity style={styles.iconButton} onPress={() => console.log('History pressed')}>
                <MaterialIcons name='payments' size={70}
                  color="#ccc"
                  style={styles.icon} />
                <Text style={styles.iconText}>History</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Check Balance pressed')}>
                <MaterialIcons name='account-balance-wallet' size={70}
                  color="#ccc"
                  style={styles.icon} />
                <Text style={styles.iconText}>CHECK</Text>
                <Text style={styles.iconText}>BALANCE</Text>
              </TouchableOpacity>
            </View>
            {/* Add more content here to ensure enough scrolling */}
            <View style={{ height: 500, backgroundColor: 'rgba(0,0,0,0.2)', marginTop: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.text}>More content below the icons to allow more scrolling.</Text>
              <Text style={styles.text}>Keep scrolling to test camera activation!</Text>
            </View>
          </View>
      

        {/* Show Camera when scrolled down, positioned absolutely over the contentAndCameraWrapper */}
        {isCameraOpen && (
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
        )}
      </View>
      </ScrollView> 
    </ImageBackground>
     
  );
};

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
  // This new wrapper will contain both the ScrollView and the absolutely positioned Camera
  contentAndCameraWrapper: {
    flex: 1, // Takes remaining vertical space
    position: 'relative', // Crucial for absolute positioning of children
    borderWidth: 4,
    borderColor: '#290551',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden', 
    marginTop:200// Ensures border radius clips content including the camera
  },
  scrollViewStyle: {
    flex: 1, // Allows ScrollView to take all available space within its parent
    // No direct border styling here, it's moved to contentAndCameraWrapper
  },
  scrollViewContent: {
    // This style applies to the content *inside* the ScrollView
    paddingBottom: 20, // To give some space at the bottom of the scrollable content
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
    ...StyleSheet.absoluteFillObject, // Fills its parent (contentAndCameraWrapper)
    zIndex: 2, // Ensures it's on top
    borderRadius: 16, // Match parent's border radius for rounded corners
    // No need for overflow: 'hidden' here if the parent has it and clips properly
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
  container: { // Used for permission message screen
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  message: { // Used for permission message screen
    textAlign: 'center',
    paddingBottom: 10,
    color: '#000',
  },
  text: { // General text style
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});

export default Home;