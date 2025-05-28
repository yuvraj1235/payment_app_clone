import { View, Text, ImageBackground,StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { getAuth, signOut } from '@react-native-firebase/auth';
const mypage = () => {

  return (
   <ImageBackground source={require('../../assets/images/background.jpg')} resizeMode="cover" style={styles.imageBackground}>
      <TouchableOpacity onPress={()=>  signOut(getAuth()).then(() => console.log('User signed out!'))}>
        <Text>log out </Text>
      </TouchableOpacity>
    </ImageBackground>
  )
}
const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    paddingTop: 50,
  }
});

export default mypage