import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, FlatList } from 'react-native';
import * as Contacts from 'expo-contacts';

export default function Contact() {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Emails,

          ],
        });

        if (data.length > 0) {
          setContacts(data);
        }
      }
    })();
  }, []);

  const renderContactCard = ({ item: contact }) => (
    <View style={styles.card}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {contact.imageUri ? (
          <Image source={{ uri: contact.imageUri }} style={styles.avatar} />
        ) : (
          <Text style={styles.avatarText}>
            {contact.name?.charAt(0) || '?'}
          </Text>
        )}
      </View>

      {/* Contact Info */}
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        {contact.phoneNumbers?.length > 0 ? (
          <Text style={styles.contactDetail}>
            Phone: {contact.phoneNumbers[0].number}
          </Text>
        ) : (
          <Text style={styles.contactDetail}>No Phone Number</Text>
        )}
        {contact.emails?.length > 0 ? (
          <Text style={styles.contactDetail}>
            Email: {contact.emails[0].email}
          </Text>
        ) : (
          <Text style={styles.contactDetail}>No Email</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContactCard}
        contentContainerStyle={styles.scrollView}
        ListEmptyComponent={
          <Text style={styles.noContactsText}>No Contacts Available</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 20,
  },
  scrollView: {
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginVertical: 10,
    flexDirection: 'row',
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
  },
  avatarWrapper: {
    backgroundColor: '#555',
    borderRadius: 40,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contactDetail: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  noContactsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});
