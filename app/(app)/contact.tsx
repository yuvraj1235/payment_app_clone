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
import { useNavigation } from '@react-navigation/native'; // Keep useNavigation for goBack
import { router } from 'expo-router'; // Use expo-router for specific routes like /camera
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const screenWidth = Dimensions.get('window').width;

// Define a type for your contact data structure from Firestore
type Contact = {
  id: string;
  username?: string; // Assuming 'username' field in Firestore
  // email?: string;     // Removed as per request
  phoneNumber?: string; // Assuming 'phoneNumber' field in Firestore
  // Add other fields you might fetch from user documents
};

// Helper function to generate a consistent color based on a string (e.g., UID or username)
const getDeterministicColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const Contacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true); // Set to true to show loading indicator initially
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const navigation = useNavigation(); // For goBack()

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
          // email: doc.data().email || 'No Email',     // Removed email fetching
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
    contact.phoneNumber?.includes(searchQuery)) // Removed email from search
  );

  // Handler for when a contact card is pressed
  const handleContactPress = (uid: string, username: string) => {
    navigation.navigate('payment', { recipientUid: uid, recipientName: username });
  };

  // Render method for individual contact items in the FlatList
  const renderContactItem = ({ item }: { item: Contact }) => {
    const initials = item.username && item.username !== 'No Name' ? item.username.charAt(0).toUpperCase() : '';
    const iconColor = getDeterministicColor(item.id || item.username || 'default'); // Use ID for consistent color

    return (
      <TouchableOpacity
        style={styles.contactCard}
        onPress={() => handleContactPress(item.id, item.username || 'Unknown User')}
      >
        <View style={[styles.contactIconCircle, { backgroundColor: iconColor + '33' }]}> {/* Lighter background tint */}
          {initials ? (
            <Text style={[styles.contactInitials, { color: iconColor }]}>{initials}</Text>
          ) : (
            <MaterialIcons name="person" size={30} color={iconColor} />
          )}
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.username}</Text>
          {item.phoneNumber && item.phoneNumber !== 'No Phone' && (
            <Text style={styles.contactDetail}>📱 {item.phoneNumber}</Text>
          )}
          {/* Removed email display */}
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#B0B0B0" />
      </TouchableOpacity>
    );
  };

  // Show loading indicator if data is being fetched
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009688" /> {/* Teal color */}
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Contacts</Text>
        <View style={{ width: 28 }} /> {/* Placeholder for alignment */}
      </View>

      {/* Search Bar - Integrated here for filtering the list */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={24} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or number" // Updated placeholder
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery} // Update search query state on text change
        />
        <TouchableOpacity style={styles.searchQrIcon} onPress={() => router.push('/camera')}> {/* Added onPress */}
          <MaterialIcons name="qr-code-scanner" size={24} color="#009688" /> {/* Teal color */}
        </TouchableOpacity>
      </View>

      {/* Conditional rendering based on filtered contacts */}
      {filteredContacts.length === 0 && !loading ? (
        <View style={styles.noContactsContainer}>
          <MaterialIcons name="person-off" size={80} color="#A0A0A0" /> {/* New icon */}
          <Text style={styles.noContactsText}>No matching contacts found.</Text>
          <Text style={styles.noContactsSubText}>Try a different name or number.</Text>
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
    backgroundColor: '#F8F5F0', // Light cream background from Home screen
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
  // Header styles (consistent with MyQRCode.tsx & VerifyPin.tsx)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#009688', // Darker Teal from Home banner
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 45, // To account for SafeAreaView and status bar
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 20, // Add margin below header
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
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
    color: '#009688', // Teal color for search icon
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
    paddingBottom: 20, // Ensure padding at the bottom of the list
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background for contact cards
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 12, // Space between cards
    borderWidth: 1, // Add a subtle border
    borderColor: '#E0E0E0', // Light border color
    shadowColor: '#000', // Subtle shadow
    shadowOffset: { width: 0, height: 2 }, // Slightly larger shadow for more depth
    shadowOpacity: 0.08, // Increased opacity
    shadowRadius: 5, // Increased radius
    elevation: 4, // Increased elevation
  },
  contactIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInitials: {
    fontSize: 20,
    fontWeight: 'bold',
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
    marginTop: 50, // Add some top margin for empty state
  },
  noContactsText: {
    fontSize: 20,
    color: '#888',
    textAlign: 'center',
    marginTop: 20, // Space below icon
    fontWeight: 'bold',
  },
  noContactsSubText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default Contacts;