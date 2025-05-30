// app/Contact.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList, // Used for efficient list rendering
  ActivityIndicator,
  Platform, // To handle platform-specific permission messages
  Alert,    // For user alerts
} from 'react-native';
import * as Contacts from 'expo-contacts'; // Import all from expo-contacts
import { useNavigation } from 'expo-router'; // Assuming expo-router for navigation
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // For back icon

const Contact = () => {
  const navigation = useNavigation();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      try {
        const { status } = await Contacts.requestPermissionsAsync();

        if (status === 'granted') {
          setPermissionGranted(true);
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
          });

          if (data.length > 0) {
            setContacts(data);
          } else {
            setError('No contacts found on your device.');
          }
        } else {
          setPermissionGranted(false);
          setError('Permission to access contacts was denied. Please enable it in settings.');
          Alert.alert(
            'Permission Denied',
            'Contact access is required to display your contacts. Please enable permissions in your device settings.',
            [
              { text: 'OK' },
              { text: 'Go to Settings', onPress: () => Platform.OS === 'ios' ? Linking.openURL('app-settings:') : null } // iOS only for direct settings link
            ]
          );
        }
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError('Failed to load contacts. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // Run once on component mount

  const renderContactItem = ({ item }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactAvatar}>
        <Text style={styles.avatarText}>
          {item.firstName ? item.firstName[0] : item.name ? item.name[0] : '?'}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name || 'No Name'}</Text>
        {item.phoneNumbers && item.phoneNumbers.length > 0 && (
          <Text style={styles.contactDetail}>
            {item.phoneNumbers[0].number}
          </Text>
        )}
        {item.emails && item.emails.length > 0 && (
          <Text style={styles.contactDetail}>
            {item.emails[0].email}
          </Text>
        )}
      </View>
      <TouchableOpacity style={styles.payButton}>
        <Text style={styles.payButtonText}>Pay</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#E0E0E0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Contacts</Text>
        <View style={{ width: 24 }} /> {/* Spacer to balance header */}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#66d9ef" />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          {!permissionGranted && (
            <TouchableOpacity style={styles.retryButton} onPress={() => Contacts.requestPermissionsAsync()}>
              <Text style={styles.retryButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Dark background
    paddingHorizontal: 15,
    paddingTop: 50, // Adjust for status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#E0E0E0',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#66d9ef',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContentContainer: {
    paddingBottom: 20, // Add some padding at the bottom of the scrollable list
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828', // Dark card background
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3a3a3a', // Darker background for avatar
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#E0E0E0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  contactDetail: {
    color: '#888', // Lighter gray for details
    fontSize: 14,
  },
  payButton: {
    backgroundColor: '#66d9ef', // Your accent color
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  payButtonText: {
    color: '#000', // Black text for contrast
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default Contact;