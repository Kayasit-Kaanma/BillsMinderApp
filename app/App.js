import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LogoPage from '../components/LogoPage';
import Login from '../components/LoginPage';
import Register from '../components/RegisterPage';
import Home from '../components/HomePage';
import PlanPage from '../components/PlanPage';
import AddPlan from '../components/AddPlanPage';
import InputData from '../components/InputDataPage';
import PreScan from '../components/PreScanPage';
import Scan from '../components/ScanPage';
import CheckPhoto from '../components/CheckPhotoPage';
import ItemList from '../components/ItemListPage';
import Summary from '../components/SummaryPage';
import TransactionHistory from '../components/TransactionHistoryPage';
import Condition from '../components/ConditionPage';
import Profile from '../components/ProfilePage';
import ChatBot from '../components/ChatBotPage';
import Notification from '../components/NotificationPage';
import SelectChatMode from '../components/SelectChatModePage';
import RAGChatBot from '../components/RAGChatBotPage';

const Stack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LogoPage">
        <Stack.Screen name="LogoPage" component={LogoPage} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
        <Stack.Screen name="Condition" component={Condition} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
        <Stack.Screen name="PlanPage" component={PlanPage} options={{ headerShown: false }} />
        <Stack.Screen name="AddPlan" component={AddPlan} options={{ headerShown: false }} />
        <Stack.Screen name="InputData" component={InputData} options={{ headerShown: false }} />
        <Stack.Screen name="PreScan" component={PreScan} options={{ headerShown: false }} />
        <Stack.Screen name="Scan" component={Scan} options={{ headerShown: false }} />
        <Stack.Screen name="CheckPhoto" component={CheckPhoto} options={{ headerShown: false }} />
        <Stack.Screen name="ItemList" component={ItemList} options={{ headerShown: false }} />
        <Stack.Screen name="Summary" component={Summary} options={{ headerShown: false }} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistory} options={{ headerShown: false }} />
        <Stack.Screen name="ChatBot" component={ChatBot} options={{ headerShown: false }} />
        <Stack.Screen name="Notification" component={Notification} options={{ headerShown: false }} />
        <Stack.Screen name="SelectChatMode" component={SelectChatMode} options={{ headerShown: false }} />
        <Stack.Screen name="RAGChatBot" component={RAGChatBot} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}