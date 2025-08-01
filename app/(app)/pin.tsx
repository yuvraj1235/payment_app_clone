import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';

export default function Pin() {
  const [userUID, setUserUID] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSettingPin, setIsSettingPin] = useState(false);

  // State for the custom modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const lottieRef = React.useRef<LottieView>(null);


  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setUserUID(user ? user.uid : null);
      setIsLoadingAuth(false);
    });
    return subscriber;
  }, []);

  // Function to show the custom modal
  const showCustomModal = (title, message, type) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
    if (type === 'success' && lottieRef.current) {
        lottieRef.current.play();
    }
  };

  const handleSubmit = async () => {
    if (isSettingPin) return;

    if (pin.length !== 6) {
      showCustomModal("Invalid PIN", "Please enter a 6-digit PIN.", 'error');
      return;
    }

    if (!userUID) {
      showCustomModal("Authentication Error", "User not logged in or session expired. Please re-login.", 'error');
      return;
    }

    setIsSettingPin(true);

    try {
      await firestore()
        .collection('users')
        .doc(userUID)
        .set({ Pin: pin }, { merge: true });

      showCustomModal('Success', 'Your PIN has been set successfully!', 'success');
      setPin('');
      // router.back(); or navigation.goBack() if using react-navigation
    } catch (error) {
      console.error("Error setting PIN: ", error);
      showCustomModal('Error', 'Failed to set PIN. Please try again.', 'error');
    } finally {
      setIsSettingPin(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009688" />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set UPI PIN</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>🔐 Set UPI PIN</Text>
          <Text style={styles.instruction}>Create your 6-digit secure PIN</Text>

          <TextInput
            value={pin}
            onChangeText={setPin}
            style={styles.pinInput}
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.submitButton, isSettingPin && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSettingPin}
          >
            {isSettingPin ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Set PIN</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Modal Dialog Box */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalType === 'success' ? (
                <LottieView
                  ref={lottieRef}
                  source={require('../../assets/Lottie Lego.json')}
                  autoPlay={true}
                  loop={false}
                  style={styles.lottieAnimation}
                  onAnimationFinish={() => setShowModal(false)}
                />
            ) : (
                <MaterialIcons name="error-outline" size={80} color="#FF5252" style={styles.modalIcon} />
            )}
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={modalType === 'success' ? styles.modalButton : styles.modalErrorButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#EEF4F4',
  },
  container: {
    flex: 1,
    backgroundColor: '#EEF4F4',
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF4F4',
  },
  loadingText: {
    marginTop: 10,
    color: '#00695C',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#009688',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? 40 : 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    color: '#004D40',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  instruction: {
    color: '#00695C',
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  pinInput: {
    color: '#009688',
    fontSize: 36,
    textAlign: 'center',
    paddingVertical: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#009688',
    width: '80%',
    marginBottom: 50,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#009688',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#B2DFDB',
    shadowColor: '#B2DFDB',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004D40',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#00695C',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    backgroundColor: '#009688',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalIcon: {
      marginBottom: 15,
  },
  modalErrorButton: {
      backgroundColor: '#FF5252',
      shadowColor: '#FF5252',
  },
  lottieAnimation: {
      width: 120,
      height: 120,
      marginBottom: 15,
  },
});
