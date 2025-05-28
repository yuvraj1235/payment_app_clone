import { createStackNavigator } from "@react-navigation/stack"
import Home from "./Home";
import mypage from "./mypage";
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useEffect, useState } from "react";
const _layout = () => {
    const Stack=createStackNavigator();
  return (
   <Stack.Navigator initialRouteName="Home">
   
      <Stack.Screen
        name="Home"
        component={Home}
        options={{ headerShown: false }} />
    
      <Stack.Screen
        name="mypage"
        component={mypage}
        options={{ headerShown: false }} />
    </Stack.Navigator>

  )
}

export default _layout