import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import messaging, { requestPermission } from '@react-native-firebase/messaging';

const RequestMoney = () => {

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
}
const getToken =async()=>{
    const token=await messaging().getToken()
    console.log("Token=",token);
    }
    useEffect(() => {
      requestUserPermission()
      getToken()
    }, [])
    
  return (
    <View>
      <Text>RequestMoney</Text>
    </View>
  )
}

export default RequestMoney