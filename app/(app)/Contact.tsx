import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList, // This will be the primary component for displaying contacts
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput, // Keeping TextInput for a potential search functionality later
  Dimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const screenWidth = Dimensions.get('window').width;

// Define a type for your contact data structure from Firestore
type Contact = {
  id: string;
  username?: string; // Assuming 'username' field in Firestore
  email?: string;     // Assuming 'email' field in Firestore
  phoneNumber?: string; // Assuming 'phoneNumber' field in Firestore
  // Add other fields you might fetch from user documents
};

const Contacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true); // Set to true to show loading indicator initially
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const navigation = useNavigation();

  useEffect(() => {
    // Function to fetch contacts from Firestore
    const fetchContacts = async () => {
      setLoading(true); // Start loading
      try {
        // Fetch all documents from the 'users' collection
        const snapshot = await firestore().collection('users').get();
        
        // Map snapshot documents to Contact objects
        const users: Contact[] = snapshot.docs.map(doc => ({
          id: doc.id, // Document ID as contact ID
          username: doc.data().username || 'No Name', // Get username, default to 'No Name'
          email: doc.data().email || 'No Email',     // Get email, default to 'No Email'
          phoneNumber: doc.data().phoneNumber || 'No Phone', // Get phoneNumber, default to 'No Phone'
        }));
        setContacts(users); // Update contacts state
      } catch (error) {
        console.error('Error fetching contacts:', error);
        // In a real app, you might want to show an error message to the user
      } finally {
        setLoading(false); // End loading regardless of success or error
      }
    };

    fetchContacts(); // Call the fetch function when the component mounts
  }, []); // Empty dependency array means this effect runs once on mount

  // Function to filter contacts based on search query
  const filteredContacts = contacts.filter(contact =>
    (contact.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber?.includes(searchQuery))
  );

  // Handler for when a contact card is pressed
  const handleContactPress = (uid: string, username: string) => {
    // Navigate to the Payment screen, passing the recipient's UID
    // You can also pass username if needed on the Payment screen
    navigation.navigate('Payment', { recipientUid: uid, recipientName: username });
  };

  // Render method for individual contact items in the FlatList
  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactCard}
      onPress={() => handleContactPress(item.id, item.username || 'Unknown User')}
    >
      <View style={styles.contactIconCircle}>
        {/* Display first letter of username or a default icon */}
        {item.username && item.username !== 'No Name' ? (
          <Text style={styles.contactInitials}>{item.username.charAt(0).toUpperCase()}</Text>
        ) : (
          <MaterialIcons name="person" size={30} color="#1A73E8" />
        )}
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.username}</Text>
        {item.phoneNumber && item.phoneNumber !== 'No Phone' && (
          <Text style={styles.contactDetail}>📱 {item.phoneNumber}</Text>
        )}
        {item.email && item.email !== 'No Email' && (
          <Text style={styles.contactDetail}>✉️ {item.email}</Text>
        )}
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#B0B0B0" />
    </TouchableOpacity>
  );

  // Show loading indicator if data is being fetched
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A73E8" />
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <MaterialIcons name="arrow-back" size={28} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Contacts</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <MaterialIcons name="help-outline" size={28} color="#4A4A4A" />
        </TouchableOpacity>
      </View>

      {/* Search Bar - Integrated here for filtering the list */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={24} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, number, or email"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery} // Update search query state on text change
        />
        <TouchableOpacity style={styles.searchQrIcon}>
          <MaterialIcons name="qr-code-scanner" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Conditional rendering based on filtered contacts */}
      {filteredContacts.length === 0 && !loading ? (
        <View style={styles.noContactsContainer}>
          <Text style={styles.noContactsText}>No matching contacts found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts} // Use filtered contacts for the list
          keyExtractor={(item) => item.id}
          renderItem={renderContactItem}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Light background color
    paddingTop: 0, // SafeAreaView handles top padding
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#F0F2F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerIcon: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 20, // Apply horizontal margin to the search bar
    marginBottom: 20, // Space below search bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchQrIcon: {
    marginLeft: 10,
    padding: 5,
  },
  flatListContent: {
    paddingHorizontal: 20, // General horizontal padding for list items
    paddingVertical: 15, // Padding for the top/bottom of the list
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background for contact cards
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 12, // Space between cards
    shadowColor: '#000', // Subtle shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  contactIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF2FB', // Light blue circle background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A73E8', // Color for initials
  },
  contactInfo: {
    flex: 1, // Allows info to take up available space
  },
  contactName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  noContactsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noContactsText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
});

export default Contacts;
