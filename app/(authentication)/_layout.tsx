import React from 'react'; 

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import index from './index';
import SignIn from './SignIn';

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
          name="SignIn" 
          component={SignIn} 
          options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
    </Tab.Navigator>
  );
};

export default AuthStackLayout;