import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { router } from 'expo-router'; // Assuming you are using expo-router

const screenHeight = Dimensions.get('window').height;

const NotFoundScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon for Not Found */}
        <MaterialIcons name="error-outline" size={100} color="#009688" style={styles.icon} />

        {/* Main Title */}
        <Text style={styles.title}>404</Text>
        <Text style={styles.subtitle}>Page Not Found</Text>

        {/* Descriptive Message */}
        <Text style={styles.message}>
          Oops! The page you are looking for does not exist or has been moved.
        </Text>

        {/* Go Back Home Button */}
        <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/(app)/home')}>
          <MaterialIcons name="home" size={24} color="#FFF" />
          <Text style={styles.homeButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F0', // Light cream background from Home screen
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    minHeight: screenHeight * 0.6, // Ensure content takes up a good portion of the screen
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#009688', // Darker Teal
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A4A4A', // Similar to grid item text color
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#009688', // Darker Teal
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  homeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default NotFoundScreen;
