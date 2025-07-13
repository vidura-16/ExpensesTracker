import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import * as Print from 'expo-print';

const screenWidth = Dimensions.get('window').width;

// Predefined categories from AddExpenseScreen
const predefinedCategories = ['Food', 'Travel', 'Extra', 'Utility'];

export default function MonthlySummary() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [summary, setSummary] = useState({});
  const [weeklyTotals, setWeeklyTotals] = useState([]);
  const [monthName, setMonthName] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [isOtherExpensesExpanded, setIsOtherExpensesExpanded] = useState(false);

  useEffect(() => {
    loadMonthlyExpenses();
  }, []);

  const loadMonthlyExpenses = async () => {
    const data = await AsyncStorage.getItem('expenses');
    const allExpenses = data ? JSON.parse(data) : [];

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    setMonthName(monthNames[month]);

    // Get all expenses for current month
    const monthly = allExpenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getFullYear() === year && expDate.getMonth() === month;
    });

    // Sort monthly expenses by date (most recent first)
    monthly.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Separate daily expenses (predefined categories) and other expenses
    const daily = monthly.filter(exp => 
      predefinedCategories.includes(exp.originalCategory || exp.category)
    );
    const others = monthly.filter(exp => 
      !predefinedCategories.includes(exp.originalCategory || exp.category)
    );

    setMonthlyData(monthly);
    setDailyExpenses(daily);
    setOtherExpenses(others);

    // Group by category for pie chart
    const grouped = {};
    monthly.forEach(exp => {
      if (!grouped[exp.category]) grouped[exp.category] = 0;
      grouped[exp.category] += exp.amount;
    });
    setSummary(grouped);

    // Calculate weekly totals with daily breakdown
    const weeks = getWeeksInMonth(year, month);
    const weeklyData = weeks.map((week, index) => {
      const weekExpenses = daily.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= week.start && expDate <= week.end;
      });

      // Group expenses by day within the week
      const dailyBreakdown = {};
      weekExpenses.forEach(exp => {
        const dayKey = exp.date;
        if (!dailyBreakdown[dayKey]) {
          dailyBreakdown[dayKey] = [];
        }
        dailyBreakdown[dayKey].push(exp);
      });

      const total = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      return {
        weekNumber: index + 1,
        total,
        start: week.start,
        end: week.end,
        dailyBreakdown
      };
    });

    setWeeklyTotals(weeklyData);
  };

  const getWeeksInMonth = (year, month) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentStart = new Date(firstDay);
    
    while (currentStart <= lastDay) {
      const weekEnd = new Date(currentStart);
      weekEnd.setDate(currentStart.getDate() + 6);
      
      if (weekEnd > lastDay) {
        weekEnd.setTime(lastDay.getTime());
      }
      
      weeks.push({
        start: new Date(currentStart),
        end: new Date(weekEnd)
      });
      
      currentStart.setDate(weekEnd.getDate() + 1);
    }
    
    return weeks;
  };

  const toggleWeekExpansion = (weekNumber) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekNumber]: !prev[weekNumber]
    }));
  };

  const getChartData = () => {
    const colors = ['#ff7675', '#74b9ff', '#ffeaa7', '#55efc4', '#a29bfe', '#fd79a8'];
    return Object.keys(summary).map((category, index) => ({
      name: category,
      amount: summary[category],
      color: colors[index % colors.length],
      legendFontColor: '#333',
      legendFontSize: 13,
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatDateRange = (start, end) => {
    const startDay = start.getDate();
    const endDay = end.getDate();
    return `${startDay}${getOrdinalSuffix(startDay)} to ${endDay}${getOrdinalSuffix(endDay)}`;
  };

  const getOrdinalSuffix = (day) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const generatePDF = async () => {
    const total = monthlyData.reduce((sum, e) => sum + e.amount, 0);
    const dailyTotal = dailyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const otherTotal = otherExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const content = `
      <h1>${monthName} Monthly Expense Summary</h1>
      
      <h2>Daily Expenses Total: Rs. ${dailyTotal.toFixed(2)}</h2>
      ${weeklyTotals.map(week => `
        <h3>Week ${week.weekNumber} (${formatDateRange(week.start, week.end)}): Rs. ${week.total.toFixed(2)}</h3>
        <ul>
          ${Object.entries(week.dailyBreakdown).map(([date, expenses]) => `
            <li><strong>${formatDate(date)}:</strong> Rs. ${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
              <ul>
                ${expenses.map(exp => `<li>${exp.category}: Rs. ${exp.amount.toFixed(2)} ${exp.note ? `(${exp.note})` : ''}</li>`).join('')}
              </ul>
            </li>
          `).join('')}
        </ul>
      `).join('')}
      
      <h2>Other Expenses Total: Rs. ${otherTotal.toFixed(2)}</h2>
      <ul>
        ${otherExpenses.map(exp => `<li>${formatDate(exp.date)} - ${exp.category}: Rs. ${exp.amount.toFixed(2)} ${exp.note ? `(${exp.note})` : ''}</li>`).join('')}
      </ul>
      
      <h2>Category Breakdown:</h2>
      <ul>
        ${Object.entries(summary).map(([cat, amt]) => `<li><b>${cat}:</b> Rs. ${amt.toFixed(2)}</li>`).join('')}
      </ul>
      
      <p><strong>Total for the Month:</strong> Rs. ${total.toFixed(2)}</p>
    `;
    await Print.printAsync({ html: content });
  };

  const groupOtherExpensesByDate = () => {
    const grouped = {};
    otherExpenses.forEach(exp => {
      if (!grouped[exp.date]) {
        grouped[exp.date] = [];
      }
      grouped[exp.date].push(exp);
    });
    return grouped;
  };

  const otherExpensesByDate = groupOtherExpensesByDate();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📅 {monthName} Summary</Text>

      {/* Daily Expenses Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Daily Expenses - {monthName}</Text>
        <Text style={styles.cardSubtitle}>
          Total: Rs. {dailyExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
        </Text>
        
        {weeklyTotals.map((week) => (
          <View key={week.weekNumber} style={styles.weekContainer}>
            <TouchableOpacity 
              style={styles.weekHeader}
              onPress={() => toggleWeekExpansion(week.weekNumber)}
            >
              <Text style={styles.weekTitle}>
                Week {week.weekNumber} ({formatDateRange(week.start, week.end)})
              </Text>
              <Text style={styles.weekAmount}>Rs. {week.total.toFixed(2)}</Text>
              <Text style={styles.expandIcon}>
                {expandedWeeks[week.weekNumber] ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            
            {expandedWeeks[week.weekNumber] && (
              <View style={styles.dailyBreakdown}>
                {Object.entries(week.dailyBreakdown).length > 0 ? (
                  Object.entries(week.dailyBreakdown)
                    .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                    .map(([date, expenses]) => (
                      <View key={date} style={styles.dayContainer}>
                        <Text style={styles.dayHeader}>
                          {formatDate(date)} - Rs. {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                        </Text>
                        {expenses.map((expense, index) => (
                          <View key={index} style={styles.expenseItem}>
                            <Text style={styles.expenseCategory}>{expense.category}</Text>
                            <Text style={styles.expenseAmount}>Rs. {expense.amount.toFixed(2)}</Text>
                            {expense.note && (
                              <Text style={styles.expenseNote}>{expense.note}</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    ))
                ) : (
                  <Text style={styles.noExpenses}>No expenses this week</Text>
                )}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Other Expenses Card */}
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.cardHeader}
          onPress={() => setIsOtherExpensesExpanded(!isOtherExpensesExpanded)}
        >
          <Text style={styles.cardTitle}>💼 Other Expenses</Text>
          <Text style={styles.cardSubtitle}>
            Total: Rs. {otherExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
          </Text>
          <Text style={styles.expandIcon}>
            {isOtherExpensesExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>
        
        {isOtherExpensesExpanded && (
          <View style={styles.otherExpensesBreakdown}>
            {Object.keys(otherExpensesByDate).length > 0 ? (
              Object.entries(otherExpensesByDate)
                .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                .map(([date, expenses]) => (
                  <View key={date} style={styles.dayContainer}>
                    <Text style={styles.dayHeader}>
                      {formatDate(date)} - Rs. {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                    </Text>
                    {expenses.map((expense, index) => (
                      <View key={index} style={styles.expenseItem}>
                        <Text style={styles.expenseCategory}>{expense.category}</Text>
                        <Text style={styles.expenseAmount}>Rs. {expense.amount.toFixed(2)}</Text>
                        {expense.note && (
                          <Text style={styles.expenseNote}>{expense.note}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                ))
            ) : (
              <Text style={styles.noExpenses}>No other expenses this month</Text>
            )}
          </View>
        )}
      </View>

      {/* Pie Chart */}
      {Object.keys(summary).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📈 Category Breakdown</Text>
          <PieChart
            data={getChartData()}
            width={screenWidth - 40}
            height={220}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            chartConfig={{
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
          />
        </View>
      )}

      {/* Total and PDF Button */}
      <View style={styles.totalCard}>
        <Text style={styles.monthlyTotal}>
          🧾 Total for the Month: Rs. {monthlyData.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
        </Text>
        <TouchableOpacity style={styles.pdfButton} onPress={generatePDF}>
          <Text style={styles.pdfButtonText}>📄 Generate PDF</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2d3436',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#636e72',
    fontWeight: '600',
  },
  weekContainer: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: '#f1f2f6',
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ddd6fe',
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    flex: 1,
  },
  weekAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3436',
    marginRight: 12,
  },
  expandIcon: {
    fontSize: 12,
    color: '#636e72',
  },
  dailyBreakdown: {
    backgroundColor: '#ffffff',
    padding: 12,
  },
  otherExpensesBreakdown: {
    marginTop: 12,
  },
  dayContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  dayHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingLeft: 12,
    paddingVertical: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#74b9ff',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 13,
    color: '#2d3436',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00b894',
  },
  expenseNote: {
    fontSize: 11,
    color: '#636e72',
    fontStyle: 'italic',
    marginTop: 2,
    flex: 1,
  },
  noExpenses: {
    fontSize: 13,
    color: '#636e72',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
  },
  totalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthlyTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2d3436',
    marginBottom: 16,
  },
  pdfButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  pdfButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});