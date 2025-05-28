import SignIn from "./SignIn";
import { createStackNavigator } from "@react-navigation/stack"
import index from "./index";
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useEffect, useState } from "react";
const _layout = () => {
    const Stack=createStackNavigator();
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={index}
        options={{ headerShown: false }} />
      <Stack.Screen
        name="SignIn"
        component={SignIn}
        options={{ headerShown: false }} />
    </Stack.Navigator>

  )
}

export default _layout