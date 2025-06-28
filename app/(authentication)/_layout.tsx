import React from 'react'; 

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import index from './index';
import SignIn from './signIn';

const Tab = createBottomTabNavigator();
const AuthStackLayout = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen 
          name="index" 
          component={index} 
          options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
      <Tab.Screen 
          name="signIn" 
          component={SignIn} 
          options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
    </Tab.Navigator>
  );
};

export default AuthStackLayout;