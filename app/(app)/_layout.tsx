import { createStackNavigator } from "@react-navigation/stack"
import Home from "./Home";
import mypage from "./mypage";
import Pay_contact from "./Pay_contact";
import Camera from "./Camera";
import Contact from "./Contact";

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
    <Stack.Screen
        name="Contact"
        component={Pay_contact}
        options={{ headerShown: false }} />
          <Stack.Screen
        name="Camera"
        component={Camera}
        options={{ headerShown: false }} />
           <Stack.Screen
        name="Contac"
        component={Contact}
        options={{ headerShown: false }} />
    </Stack.Navigator>
  
    

  )
}

export default _layout