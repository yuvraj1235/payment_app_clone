import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TextInput,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { LineChart } from 'react-native-chart-kit';

type RootStackParamList = {
  navigate(arg0: string): void;
  mypage: undefined;
  Camera: undefined;
  Payment: { recipientUid: string };
};

const Home = () => {
  const navigation = useNavigation<RootStackParamList>();
  const [userUID, setUserUID] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setUserUID(user ? user.uid : null);
      setLoadingAuth(false);
    });
    return subscriber;
  }, []);

  const fetchUserBalance = async () => {
    if (userUID) {
      setLoadingBalance(true);
      setError(null);
      try {
        const doc = await firestore().collection('users').doc(userUID).get();
        if (doc.exists) {
          const data = doc.data();
          setBalance(data?.balance?.toString() || '0');
        } else {
          setBalance('0');
        }
      } catch (e) {
        console.error(e);
        setError('Failed to fetch balance');
        setBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    }
  };

  useEffect(() => {
    if (!loadingAuth && userUID) fetchUserBalance();
  }, [userUID, loadingAuth]);

  const onRefresh = async () => {
    setRefreshing(true);
    setShowBalance(false);
    await fetchUserBalance();
    setRefreshing(false);
  };

  if (loadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#66d9ef" />
        <Text style={styles.loadingTextIndicator}>Loading user session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput style={styles.searchText} placeholder="Search by contacts, bills" />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('mypage')}>
          <MaterialIcons name="person" size={40} color="#888" style={styles.profileIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        <View style={styles.balanceContainer}>
          {loadingBalance ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.balanceRow}>
              {showBalance ? (
                <Text style={styles.balanceAmount}>₹{balance ? parseFloat(balance).toFixed(2) : '0.00'}</Text>
              ) : (
                <Text style={styles.balanceObscured}>₹ ******.**</Text>
              )}
              <TouchableOpacity
                onPress={() => (showBalance)?setShowBalance(false): navigation.navigate('VerifyPin', { onSuccess: () => setShowBalance(true) })}
                style={styles.eyeIconWrapper}
              >

                <MaterialIcons
                  name={showBalance ? 'remove-red-eye' : 'visibility-off'}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.updatedText}>Updated just now</Text>
        </View>

        <ImageBackground
          source={require('../../assets/images/background.jpg')}
          style={styles.graphAreaPlaceholder}
        >
          <LineChart
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [
                {
                  data: Array.from({ length: 6 }, () => Math.random() * 100),
                },
              ],
            }}
            width={Dimensions.get('window').width}
            height={220}
            yAxisLabel="₹"
            chartConfig={{
              backgroundColor: '#000',
              backgroundGradientFrom: '#444',
              backgroundGradientTo: '#222',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726',
              },
            }}
            bezier
            style={{ borderRadius: 16 }}
          />
        </ImageBackground>

        <View style={styles.scannerIconWrapper}>
          <TouchableOpacity style={styles.scannerIcon} onPress={() => navigation.navigate('Camera')}>
            <MaterialIcons name="qr-code-2" size={40} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.gridIconsContainer}>
          <TouchableOpacity style={styles.gridIconButton} onPress={() => navigation.navigate('contact')}>
            <MaterialIcons name="account-balance" size={30} color="white" />
            <Text style={styles.gridIconText}>Bank transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridIconButton} onPress={() => navigation.navigate('Pin')}>
            <MaterialIcons name="receipt" size={30} color="white" />
            <Text style={styles.gridIconText}>Pay bills</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridIconButton}>
            <MaterialIcons name="mobile-friendly" size={30} color="white" />
            <Text style={styles.gridIconText}>Mobile recharge</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridIconButton} onPress={()=>navigation.navigate("history")}>
            <MaterialIcons name="history" size={30} color="white" />
            <Text style={styles.gridIconText}>Transaction history</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.upiIdText}>UPI ID: notgirish@yobank</Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>People</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.personCircle}>
              <Image style={styles.personImage} source={require('../../assets/images/google.png')} />
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Businesses</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={styles.businessCircle}>
              <Image style={styles.businessImage} source={require('../../assets/images/google.png')} />
            </View>
          ))}
        </ScrollView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 10, paddingTop: 50 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  loadingTextIndicator: { color: '#fff', marginTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  searchBar: { flexDirection: 'row', backgroundColor: '#1f1f1f', padding: 10, borderRadius: 10, flex: 1, marginRight: 10 },
  searchIcon: { marginRight: 10 },
  searchText: { color: '#fff', flex: 1 },
  profileIcon: { paddingHorizontal: 5 },
  scrollViewContent: { paddingHorizontal: 10 },
  balanceContainer: { backgroundColor: '#1f1f1f', padding: 20, borderRadius: 12, marginVertical: 10 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceAmount: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  balanceObscured: { fontSize: 28, color: '#fff', letterSpacing: 2 },
  eyeIconWrapper: { marginLeft: 10 },
  updatedText: { color: '#aaa', marginTop: 8, fontSize: 12 },
  errorText: { color: 'red', fontSize: 14 },
  graphAreaPlaceholder: { marginTop: 10, borderRadius: 16, overflow: 'hidden' },
  scannerIconWrapper: { alignItems: 'center', marginVertical: 20 },
  scannerIcon: { backgroundColor: '#fff', padding: 20, borderRadius: 50 },
  gridIconsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 20 },
  gridIconButton: { width: '47%', backgroundColor: '#1f1f1f', padding: 15, marginBottom: 10, borderRadius: 10, alignItems: 'center' },
  gridIconText: { color: '#fff', marginTop: 8 },
  upiIdText: { color: '#ccc', textAlign: 'center', marginVertical: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  sectionTitle: { color: '#fff', fontSize: 16 },
  viewAllText: { color: '#00f' },
  horizontalScroll: { paddingVertical: 10 },
  personCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  personImage: { width: 40, height: 40, resizeMode: 'contain' },
  businessCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#444', justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  businessImage: { width: 40, height: 40, resizeMode: 'contain' },
});

export default Home;
