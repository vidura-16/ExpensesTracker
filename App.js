import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import MonthlySummary from './src/screens/MonthlySummary';
import AddOtherExpenses from './src/screens/AddOtherExpenses';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Add Expense" component={AddExpenseScreen} />
        <Stack.Screen name="Add Other Expenses" component={AddOtherExpenses} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="MonthlySummary"component={MonthlySummary}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
