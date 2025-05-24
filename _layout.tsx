import SignIn from "./SignIn";
import { createStackNavigator } from "@react-navigation/stack"
import Home from "./Home";
import index from "./index";

const Stack = createStackNavigator();

export default function RootLayout() {
  return (
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={index}
          options={{ headerShown: false }} />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }} />
        <Stack.Screen
          name="SignIn"
          component={SignIn}
          options={{ headerShown: false }} />
      </Stack.Navigator>

  )
}
