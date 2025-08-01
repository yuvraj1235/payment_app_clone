import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Camera from './camera';
import Contact from './contact';
import History from './history';
import Home from './home';
import MyPage from './mypage';
import PaymentScreen from './payment';
import Pin from './pin';
import VerifyPin from './verifyPin';
import SplitBill from './splitBill';
import PayRequest from './payrequest';
import BalanceScreen from './balance';
import PaymentSuccess from './paymentSuccess';
import MyQRCode from './myqr';
import Addmoney from './addMoney';

const Tab = createBottomTabNavigator();

const RootLayout = () => {
  
  return (
  
      <Tab.Navigator>
        {/* Tab for Home Screen */}
        <Tab.Screen 
          name="home" 
          component={Home} 
          options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />

        {/* Tab for Camera Screen */}
        <Tab.Screen 
          name="camera" 
          component={Camera} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
       
         <Tab.Screen 
          name="payrequest" 
          component={PayRequest} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
          <Tab.Screen 
          name="paymentSuccess" 
          component={PaymentSuccess} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
          <Tab.Screen 
          name="myqr" 
          component={MyQRCode} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
         <Tab.Screen 
          name="addMoney" 
          component={Addmoney} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />

        {/* Tab for Contact Screen */}
        <Tab.Screen 
          name="contact" 
          component={Contact} 
          options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
         <Tab.Screen 
          name="balance" 
          component={BalanceScreen} 
          options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
      <Tab.Screen 
          name="pin" 
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
          name="verifyPin" 
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
          name="payment" 
          component={PaymentScreen} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
        <Tab.Screen 
          name="splitBill" 
          component={SplitBill} 
           options={{ headerShown: false ,tabBarStyle: { display: 'none' }}} 
        />
      </Tab.Navigator>
   
  );
};

export default RootLayout;
