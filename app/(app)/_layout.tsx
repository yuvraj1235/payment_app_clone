import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


// Import your screens (adjust paths based on your actual file structure)
import Camera from './Camera';
import Contact from './Contact';
import History from './History';
import Home from './Home';
import MyPage from './mypage';
import PaymentScreen from './Payment';
import Pin from './Pin';
import VerifyPin from './VerifyPin';
import SplitBill from './SplitBill';

const Tab = createBottomTabNavigator();

const RootLayout = () => {
  return (
  
      <Tab.Navigator>
        {/* Tab for Home Screen */}
        <Tab.Screen 
          name="Home" 
          component={Home} 
          options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />

        {/* Tab for Camera Screen */}
        <Tab.Screen 
          name="Camera" 
          component={Camera} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />

        {/* Tab for Contact Screen */}
        <Tab.Screen 
          name="contact" 
          component={Contact} 
          options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
      <Tab.Screen 
          name="Pin" 
          component={Pin} 
          options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
        {/* Tab for History Screen */}
        <Tab.Screen 
          name="history" 
          component={History} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
         <Tab.Screen 
          name="VerifyPin" 
          component={VerifyPin} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />

        {/* Tab for MyPage Screen */}
        <Tab.Screen 
          name="mypage" 
          component={MyPage} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}}  
        />

  

        {/* Tab for Payment Screen */}
        <Tab.Screen 
          name="Payment" 
          component={PaymentScreen} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
        <Tab.Screen 
          name="Split" 
          component={SplitBill} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
      </Tab.Navigator>
   
  );
};

export default RootLayout;
