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
import GooglePayButton from '@google-pay/button-react';
type RootStackParamList = {
  navigate(arg0: string): void;
  mypage: undefined;
  Camera: undefined;
  Payment: { recipientUid: string };
  SplitBill: undefined;
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
          <TouchableOpacity style={styles.gridIconButton} onPress={() => navigation.navigate('Split')}>
            <MaterialIcons name="groups" size={30} color="white" />
            <Text style={styles.gridIconText}>Split Bill</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridIconButton} onPress={() => navigation.navigate("history") }>
            <MaterialIcons name="history" size={30} color="white" />
            <Text style={styles.gridIconText}>Transaction history</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.upiIdText}>UPI ID: notgirish@yobank</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    paddingTop: 30,
    paddingHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0B',
  },
  loadingTextIndicator: {
    color: '#9B9B9B',
    fontSize: 14,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    padding: 8,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#00F9C5',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
  profileIcon: {
    padding: 5,
  },
  scrollViewContent: {
    paddingBottom: 60,
  },
  balanceContainer: {
    backgroundColor: '#101010',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00FFB2',
    shadowColor: '#00FFD5',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 30,
    color: '#00FFDD',
    fontWeight: 'bold',
  },
  balanceObscured: {
    fontSize: 30,
    color: '#2A2A2A',
    letterSpacing: 4,
  },
  eyeIconWrapper: {
    marginLeft: 10,
  },
  updatedText: {
    color: '#555555',
    marginTop: 10,
    fontSize: 11,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#FF4C4C',
    fontSize: 14,
    textAlign: 'center',
  },
  graphAreaPlaceholder: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#00FFE0',
  },
  scannerIconWrapper: {
    alignItems: 'center',
    marginVertical: 24,
  },
  scannerIcon: {
    backgroundColor: '#00FFCC',
    padding: 18,
    borderRadius: 80,
    shadowColor: '#00FFCC',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 10,
  },
  gridIconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  gridIconButton: {
    width: '48%',
    backgroundColor: '#161616',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00FFF6',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  gridIconText: {
    color: '#F5F5F5',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  upiIdText: {
    color: '#AFAFAF',
    textAlign: 'center',
    fontSize: 13,
    letterSpacing: 1.1,
    marginVertical: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    color: '#00FFEB',
    fontSize: 13,
    fontWeight: '600',
  },
  horizontalScroll: {
    paddingVertical: 12,
  },
  personCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#0FF',
  },
  personImage: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  businessCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#323232',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#00FFD5',
  },
  businessImage: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
});
export default Home;
