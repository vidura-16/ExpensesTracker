import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function FullHistoryScreen() {
  const [weeklyExpenses, setWeeklyExpenses] = useState({});
  const [otherExpenses, setOtherExpenses] = useState({});
  const [target, setTarget] = useState(0);
  const [expandedDaily, setExpandedDaily] = useState(false);
  const navigation = useNavigation();
  
  // Predefined daily categories
  const dailyCategories = ['Food', 'Travel', 'Utility'];

  useEffect(() => {
    loadExpenses();
    loadTarget();
  }, []);

  const loadTarget = async () => {
    const value = await AsyncStorage.getItem('daily_target');
    if (value) setTarget(parseFloat(value));
  };

  const loadExpenses = async () => {
    try {
      const data = await AsyncStorage.getItem('expenses');
      const allExpenses = data ? JSON.parse(data) : [];

      // Separate weekly (daily) and other expenses
      const weekly = {};
      const other = {};

      allExpenses.forEach((exp) => {
        // Check if it's a daily expense (predefined categories) or has originalCategory
        const isDailyExpense = dailyCategories.includes(exp.originalCategory || exp.category) || 
                              exp.originalCategory === 'Extra';

        if (isDailyExpense) {
          if (!weekly[exp.date]) weekly[exp.date] = [];
          weekly[exp.date].push(exp);
        } else {
          if (!other[exp.date]) other[exp.date] = [];
          other[exp.date].push(exp);
        }
      });

      setWeeklyExpenses(weekly);
      setOtherExpenses(other);
    } catch (e) {
      console.error('Failed to load expenses', e);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric',
    });
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getCurrentWeekExpenses = (expenses) => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    return Object.keys(expenses).filter(date => {
      const expenseDate = new Date(date);
      return expenseDate >= startOfWeek && expenseDate <= endOfWeek;
    });
  };

  const getCurrentMonthWeekExpenses = (expenses) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return Object.keys(expenses).filter(date => {
      const expenseDate = new Date(date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
  };

  const calculateTotal = (expenses, dates) => {
    return dates.reduce((total, date) => {
      const dayExpenses = expenses[date] || [];
      return total + dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }, 0);
  };

  const renderTodayExpensesByCategory = (expenses, todayDate) => {
    const todayExpenses = expenses[todayDate] || [];
    
    if (todayExpenses.length === 0) {
      return <Text style={styles.emptyText}>No expenses today</Text>;
    }

    // Group by category and note
    const groupedByCategoryNote = todayExpenses.reduce((acc, exp) => {
      const key = `${exp.category}||${exp.note || ''}`;
      if (!acc[key]) acc[key] = { ...exp, amount: 0 };
      acc[key].amount += exp.amount;
      return acc;
    }, {});

    return (
      <View>
        {Object.values(groupedByCategoryNote).map((item, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryText}>{item.category}</Text>
              {item.note ? (
                <Text style={styles.categoryNote}>Note: {item.note}</Text>
              ) : null}
            </View>
            <Text style={styles.categoryAmount}>Rs. {item.amount.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderWeeklyExpenses = (expenses, weekDates, todayDate) => {
    const otherDays = weekDates.filter(date => date !== todayDate);
    
    if (otherDays.length === 0) {
      return <Text style={styles.emptyText}>No other expenses this week</Text>;
    }

    return otherDays.sort((a, b) => new Date(b) - new Date(a)).map(date => {
      const dayExpenses = expenses[date] || [];
      const dayTotal = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      return (
        <View key={date} style={styles.weekDayItem}>
          <Text style={styles.weekDayDate}>{formatDate(date)}</Text>
          <Text style={styles.weekDayAmount}>Rs. {dayTotal.toFixed(2)}</Text>
        </View>
      );
    });
  };

  const getWeekNumber = (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const diffInDays = Math.floor((date - startOfMonth) / (24 * 60 * 60 * 1000));
    return Math.floor(diffInDays / 7) + 1;
  };

  const getWeekDateRange = (weekNum, year, month) => {
    const startOfMonth = new Date(year, month, 1);
    const startDate = new Date(startOfMonth);
    startDate.setDate(1 + (weekNum - 1) * 7);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Ensure we don't go beyond the current month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    if (endDate.getDate() > lastDayOfMonth) {
      endDate.setDate(lastDayOfMonth);
    }
    
    return {
      start: startDate.getDate(),
      end: endDate.getDate()
    };
  };

  const renderMonthlyWeekExpenses = (expenses, monthDates, currentWeekDates) => {
    const otherWeekDates = monthDates.filter(date => !currentWeekDates.includes(date));
    
    if (otherWeekDates.length === 0) {
      return <Text style={styles.emptyText}>No other expenses this month</Text>;
    }

    // Group dates by week
    const weekGroups = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    otherWeekDates.forEach(date => {
      const dateObj = new Date(date);
      const weekNum = getWeekNumber(dateObj);
      
      if (!weekGroups[weekNum]) {
        weekGroups[weekNum] = [];
      }
      weekGroups[weekNum].push(date);
    });

    return Object.keys(weekGroups).sort((a, b) => parseInt(a) - parseInt(b)).map(weekNum => {
      const weekDates = weekGroups[weekNum].sort((a, b) => new Date(b) - new Date(a));
      const weekRange = getWeekDateRange(parseInt(weekNum), currentYear, currentMonth);
      const weekTotal = calculateTotal(expenses, weekDates);

      return (
        <View key={weekNum} style={styles.weekGroupSection}>
          <Text style={styles.weekGroupTitle}>
            📅 Week {weekNum} ({weekRange.start}{weekRange.start !== weekRange.end ? `-${weekRange.end}` : ''}) - Rs. {weekTotal.toFixed(2)}
          </Text>
          
          {weekDates.map(date => {
            const dayExpenses = expenses[date] || [];
            const dayTotal = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            
            // Group same category+note
            const groupedByCategoryNote = dayExpenses.reduce((acc, exp) => {
              const key = `${exp.category}||${exp.note || ''}`;
              if (!acc[key]) acc[key] = { ...exp, amount: 0 };
              acc[key].amount += exp.amount;
              return acc;
            }, {});
            
            return (
              <View key={date} style={styles.expandedDateSection}>
                <Text style={styles.expandedDate}>🗓 {formatDate(date)} - {new Date(date).toLocaleDateString(undefined, { year: 'numeric' })}</Text>
                
                {Object.values(groupedByCategoryNote).map((item, index) => (
                  <View key={index} style={styles.expandedItem}>
                    <Text style={styles.expandedItemText}>
                      • {item.category}: Rs. {item.amount.toFixed(2)}
                    </Text>
                    {item.note ? (
                      <Text style={styles.expandedNote}>  Note: {item.note}</Text>
                    ) : null}
                  </View>
                ))}
                
                <Text style={styles.expandedTotal}>Day Total: Rs. {dayTotal.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>
      );
    });
  };

  const renderOtherExpensesSummary = (otherExpenses) => {
    const today = getTodayString();
    const todayOther = otherExpenses[today] || [];
    const todayOtherTotal = todayOther.reduce((sum, exp) => sum + exp.amount, 0);

    if (todayOtherTotal === 0) {
      return <Text style={styles.emptyText}>No other expenses today</Text>;
    }

    return (
      <View style={styles.otherSummaryItem}>
        <Text style={styles.otherSummaryText}>Today's Other Expenses</Text>
        <Text style={styles.otherSummaryAmount}>Rs. {todayOtherTotal.toFixed(2)}</Text>
      </View>
    );
  };

  // Get data
  const today = getTodayString();
  const currentWeekDates = getCurrentWeekExpenses(weeklyExpenses);
  const currentMonthWeekDates = getCurrentMonthWeekExpenses(weeklyExpenses);
  const todayTotal = calculateTotal(weeklyExpenses, [today]);
  const weeklyTotal = calculateTotal(weeklyExpenses, currentWeekDates);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>📊 Expense Overview</Text>

      {/* Daily Expenses Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📅 Today's Expenses</Text>
          <Text style={styles.cardSubtitle}>{formatDate(today)}</Text>
        </View>
        
        {/* Today's expenses by category */}
        <View style={styles.todaySection}>
          {renderTodayExpensesByCategory(weeklyExpenses, today)}
          <View style={styles.todayTotal}>
            <Text style={styles.todayTotalText}>Today's Total: Rs. {todayTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Rest of the week */}
        <View style={styles.weekSection}>
          <Text style={styles.weekTitle}>Rest of This Week</Text>
          {renderWeeklyExpenses(weeklyExpenses, currentWeekDates, today)}
          <View style={styles.weekTotal}>
            <Text style={styles.weekTotalText}>Weekly Total: Rs. {weeklyTotal.toFixed(2)}</Text>
          </View>
        </View>
        
        {/* Expanded Monthly View */}
        {expandedDaily && (
          <View style={styles.expandedSection}>
            <Text style={styles.expandedTitle}>📋 Rest of This Month</Text>
            {renderMonthlyWeekExpenses(weeklyExpenses, currentMonthWeekDates, currentWeekDates)}
          </View>
        )}
        
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.seeMoreButton}
            onPress={() => setExpandedDaily(!expandedDaily)}
          >
            <Text style={styles.seeMoreText}>
              {expandedDaily ? 'See Less ↑' : 'See More (Month) ↓'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Other Expenses Summary */}
      <View style={styles.otherCard}>
        <View style={styles.otherHeader}>
          <Text style={styles.otherTitle}>💼 Other Expenses</Text>
        </View>
        {renderOtherExpensesSummary(otherExpenses)}
      </View>

      {/* Monthly Summary Card */}
      <TouchableOpacity 
        style={styles.monthlyButton}
        onPress={() => navigation.navigate('MonthlySummary')}
      >
        <Text style={styles.monthlyButtonText}>📈 View Monthly Summary</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// Add these styles to your existing styles
const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  todaySection: {
    marginBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  categoryNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  todayTotal: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  todayTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  weekSection: {
    marginBottom: 16,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  weekDayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  weekDayDate: {
    fontSize: 14,
    color: '#666',
  },
  weekDayAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  weekTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  weekTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
  },
  weekGroupSection: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  weekGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  expandedDateSection: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  expandedDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  expandedItem: {
    marginBottom: 4,
  },
  expandedItemText: {
    fontSize: 14,
    color: '#333',
  },
  expandedNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  expandedTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
    textAlign: 'right',
  },
  cardFooter: {
    alignItems: 'center',
  },
  seeMoreButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  seeMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  otherCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  otherHeader: {
    marginBottom: 8,
  },
  otherTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  otherSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otherSummaryText: {
    fontSize: 14,
    color: '#666',
  },
  otherSummaryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  monthlyButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  monthlyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 16,
  },
};