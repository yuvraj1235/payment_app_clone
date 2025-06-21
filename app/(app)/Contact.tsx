import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from 'expo-router';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const snapshot = await firestore().collection('users').get();
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setContacts(users);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const handleContactPress = (uid) => {
    navigation.navigate('Payment', { recipientUid: uid });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleContactPress(item.id)}>
      <Text style={styles.name}>{item.username}</Text>
      <Text style={styles.email}>{item.email}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ffcc" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>All Contacts</Text>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#101010',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
  },
 card: {
  backgroundColor: '#1a1a1a',
  paddingVertical: 20,
  paddingHorizontal: 22,
  marginBottom: 16,
  borderRadius: 16,
  borderWidth: 2,
  borderColor: '#00ffe0', // Neon cyan
  shadowColor: '#00ffe0',
  shadowOpacity: 0.6,
  shadowOffset: { width: 0, height: 0 },
  shadowRadius: 10,
  elevation: 10, // Android shadow
},

  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  email: {
    fontSize: 15,
    color: '#bbbbbb',
  },
});

export default Contacts;
