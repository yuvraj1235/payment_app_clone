import SignIn from "./(authentication)/SignIn";
import { createStackNavigator } from "@react-navigation/stack"
import Home from "./(app)/Home";
import index from "./(authentication)/index";
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useEffect, useState } from "react";
import mypage from "./(app)/mypage";
import { Stack } from "expo-router";
GoogleSignin.configure({
  webClientId: '117652753991-ft7ta0356tqh9snqjcpuig2kb51r3cbv.apps.googleusercontent.com',
});



export default function RootLayout() {
 const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function handleAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;
  return (
 <Stack>
      <Stack.Protected guard={user}>
        <Stack.Screen name="(app)"  options={{headerShown:false}}/>
      </Stack.Protected>

      <Stack.Protected guard={!user}>
        <Stack.Screen name="(authentication)" options={{headerShown:false}}/>
      </Stack.Protected>
    </Stack>
    // <Stack.Navigator initialRouteName="Login">
    //   <Stack.Screen
    //     name="Login"
    //     component={index}
    //     options={{ headerShown: false }} />
    //   <Stack.Screen
    //     name="Home"
    //     component={Home}
    //     options={{ headerShown: false }} />
    //   <Stack.Screen
    //     name="SignIn"
    //     component={SignIn}
    //     options={{ headerShown: false }} />
    //   <Stack.Screen
    //     name="mypage"
    //     component={mypage}
    //     options={{ headerShown: false }} />
    // </Stack.Navigator>

  )
}
