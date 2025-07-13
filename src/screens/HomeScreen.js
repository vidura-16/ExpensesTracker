import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [dailyTotalSpent, setDailyTotalSpent] = useState(0);
  const [otherTotalSpent, setOtherTotalSpent] = useState(0);
  const [target, setTarget] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [otherCategories, setOtherCategories] = useState([]);
  const isFocused = useIsFocused();
  const STORAGE_TARGET_KEY = 'daily_target';
  
  // Predefined daily categories
  const dailyCategories = ['Food', 'Travel', 'Utility'];

  const getFormattedDate = () => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date().toLocaleDateString(undefined, options);
  };

  const loadTarget = async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_TARGET_KEY);
      if (value !== null) {
        setTarget(value);
        setTargetInput(value);
      }
    } catch (e) {
      console.error('Failed to load target', e);
    }
  };

  const saveTarget = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_TARGET_KEY, targetInput);
      setTarget(targetInput);
      setShowSavedMessage(true);
      Alert.alert('Target Saved', `Daily target set to Rs. ${targetInput}`);
      loadExpenses(); // re-check savings
    } catch (e) {
      console.error('Failed to save target', e);
    }
  };

  const loadExpenses = async () => {
    try {
      const data = await AsyncStorage.getItem('expenses');
      const allExpenses = data ? JSON.parse(data) : [];
      const today = new Date().toISOString().split('T')[0];
      const todayExpenses = allExpenses.filter((e) => e.date === today);
      
      // Separate daily and other expenses
      const dailyExps = [];
      const otherExps = [];
      
      todayExpenses.forEach((exp) => {
        // Check if it's a daily expense (predefined categories) or has originalCategory
        const isDailyExpense = dailyCategories.includes(exp.originalCategory || exp.category) || 
                              exp.originalCategory === 'Extra';
        
        if (isDailyExpense) {
          dailyExps.push(exp);
        } else {
          otherExps.push(exp);
        }
      });
      
      setDailyExpenses(dailyExps);
      setOtherExpenses(otherExps);
      
      // Calculate totals
      const dailyTotal = dailyExps.reduce((sum, e) => sum + e.amount, 0);
      const otherTotal = otherExps.reduce((sum, e) => sum + e.amount, 0);
      
      setDailyTotalSpent(dailyTotal);
      setOtherTotalSpent(otherTotal);
      
      // Get unique other categories for display
      const uniqueOtherCategories = [...new Set(otherExps.map(exp => exp.category))];
      setOtherCategories(uniqueOtherCategories);
      
    } catch (e) {
      console.error('Failed to load expenses', e);
    }
  };

  useEffect(() => {
    loadTarget();
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadExpenses();
    }
  }, [isFocused, target]);

  const remaining = target ? parseFloat(target) - dailyTotalSpent : 0;
  const progressPercentage = target ? Math.min((dailyTotalSpent / parseFloat(target)) * 100, 100) : 0;

  // Generate category display with colors and icons
  const getCategoryDisplay = (categories) => {
    const categoryIcons = {
      'Rent': '🏠',
      'Groceries': '🛒', 
      'Utilities': '⚡',
      'Transport': '🚗',
      'Internet': '🌐',
      'Phone': '📱',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Education': '📚',
      'Insurance': '🛡️',
      'Investment': '💰'
    };
    
    const categoryColors = [
      '#f78fb3', '#70a1ff', '#a29bfe', '#00cec9', 
      '#fd79a8', '#fdcb6e', '#e17055', '#00b894',
      '#6c5ce7', '#fd79a8', '#55a3ff', '#26de81'
    ];
    
    return categories.map((category, index) => ({
      name: category,
      icon: categoryIcons[category] || '💼',
      color: categoryColors[index % categoryColors.length]
    }));
  };

  const otherExpenseCategories = getCategoryDisplay(otherCategories);
  
  return (
    <ScrollView style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.headerGradient}>
        <Text style={styles.header}>💰 Expense Tracker</Text>
        <Text style={styles.date}>{getFormattedDate()}</Text>
      </View>
  
      <View style={styles.content}>
        {/* TARGET SETTING CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Set Daily Expense Target</Text>
          <View style={styles.targetInputRow}>
            <Text style={styles.currencySymbol}>Rs.</Text>
            <TextInput
              style={styles.targetInput}
              keyboardType="numeric"
              value={targetInput}
              onChangeText={setTargetInput}
              placeholder="Enter daily target"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity style={styles.saveTargetButton} onPress={saveTarget}>
              <Text style={styles.saveTargetText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
  
        {/* ADD EXPENSE BUTTON */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={() => navigation.navigate('Add Expense')}
          >
            <Text style={styles.actionButtonText}>➕ Add Daily Expense</Text>
          </TouchableOpacity>
        </View>
  
        {/* PROGRESS BAR SECTION - Only for Daily Expenses */}
        {target && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Daily Spending Progress</Text>
              <Text style={styles.progressPercentage}>{progressPercentage.toFixed(0)}%</Text>
            </View>
            <View style={styles.spendingDetails}>
              <Text style={styles.spentText}>Spent: Rs. {dailyTotalSpent.toFixed(2)}</Text>
              <Text style={styles.targetText}>Target: Rs. {parseFloat(target).toFixed(2)}</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: progressPercentage > 100 ? '#ff4757' : '#5352ed'
                  }
                ]}
              />
            </View>
            <Text style={[
              styles.remainingText,
              { color: remaining >= 0 ? '#2ed573' : '#ff4757' }
            ]}>
              {remaining >= 0 ? 'Remaining: ' : 'Over budget: '}
              Rs. {Math.abs(remaining).toFixed(2)}
            </Text>
          </View>
        )}
  
        {/* OTHER EXPENSES SECTION */}
        <View style={styles.otherContainer}>
          <View style={styles.otherHeader}>
            <Text style={styles.otherTitle}>🏠 Other Expenses</Text>
            <Text style={styles.otherTotal}>Rs. {otherTotalSpent.toFixed(2)}</Text>
          </View>
          
          {otherExpenseCategories.length > 0 ? (
            <>
              <View style={styles.tagContainer}>
                {otherExpenseCategories.map((category, index) => (
                  <Text key={index} style={[styles.categoryTag, { backgroundColor: category.color }]}>
                    {category.icon} {category.name}
                  </Text>
                ))}
              </View>
              
              <Text style={styles.categoryNote}>
                Today • {otherExpenseCategories.length} {otherExpenseCategories.length === 1 ? 'category' : 'categories'}
              </Text>
            </>
          ) : (
            <Text style={styles.categoryNote}>No other expenses today</Text>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.otherAddButton]}
            onPress={() => navigation.navigate('Add Other Expenses')}
          >
            <Text style={styles.actionButtonText}>➕ Add Other Expense</Text>
          </TouchableOpacity>
        </View>
  
        {/* HISTORY BUTTON */}
        <TouchableOpacity
          style={[styles.actionButton, styles.historyButton]}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.actionButtonText}>📊 View History</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // MAIN CONTAINER
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // HEADER SECTION
  headerGradient: {
    backgroundColor: '#667eea',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // CONTENT WRAPPER
  content: {
    padding: 20,
    marginTop: -5,
  },

  // CARD COMPONENTS
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  spendingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  spentText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  targetText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  // TARGET INPUT SECTION
  targetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  currencySymbol: {
    fontSize: 16,
    marginRight: 4,
    color: '#333',
  },
  targetInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
  },
  saveTargetButton: {
    marginLeft: 10,
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveTargetText: {
    color: '#fff',
    fontWeight: '600',
  },

  // ACTION BUTTONS
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 0,
  },
  addButton: {
    backgroundColor: '#2ed573',
    marginRight: 5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // PROGRESS SECTION
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5352ed',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // OTHER EXPENSES SECTION
  otherContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  otherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  otherTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  otherTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  categoryTag: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },
  categoryNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  otherAddButton: {
    backgroundColor: '#a29bfe',
  },

  // HISTORY BUTTON
  historyButton: {
    backgroundColor: '#ffa502',
  },
});