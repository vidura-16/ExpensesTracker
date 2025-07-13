import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const categories = [
  { label: '🍔 Food', value: 'Food', color: '#ff6b6b', icon: '🍔' },
  { label: '🚗 Travel', value: 'Travel', color: '#4ecdc4', icon: '🚗' },
  { label: '✨ Extra', value: 'Extra', color: '#ffa502', icon: '✨' },
  { label: '⚡ Utility', value: 'Utility', color: '#5352ed', icon: '⚡' }
];

export default function AddExpenseScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  

  const saveExpense = async (goHome = false) => {
    if (!amount || isNaN(amount) || !category) {
      Alert.alert('Missing Fields', 'Please enter a valid amount and category');
      return;
    }
  
    if (category === 'Extra' && !note.trim()) {
      Alert.alert('Missing Note', 'Please specify what the Extra expense is for');
      return;
    }
  
    const displayCategory = category === 'Extra' ? note.trim() : category;
  
    const expense = {
      id: Date.now(),
      amount: parseFloat(amount),
      category: displayCategory,
      originalCategory: category, // for internal use if needed
      note,
      date: new Date().toISOString().split('T')[0],
    };
  
    try {
      const data = await AsyncStorage.getItem('expenses');
      const existing = data ? JSON.parse(data) : [];
      const updated = [expense, ...existing];
      await AsyncStorage.setItem('expenses', JSON.stringify(updated));
      Alert.alert('Success! 🎉', 'Expense added successfully');
  
      setAmount('');
      setCategory('');
      setNote('');
  
      if (goHome) {
        navigation.goBack();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save expense');
    }
  };
  
  const selectCategory = (selectedCategory) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
  };

  const getSelectedCategoryData = () => {
    return categories.find(cat => cat.value === category);
  };

  // Custom Modal Picker
  const CustomCategoryPicker = () => (
    <Modal
      visible={showCategoryModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Category</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.value}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  category === item.value && styles.selectedCategoryItem
                ]}
                onPress={() => selectCategory(item.value)}
              >
                <View style={styles.categoryItemContent}>
                  <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                    <Text style={styles.categoryIconText}>{item.icon}</Text>
                  </View>
                  <Text style={[
                    styles.categoryText,
                    category === item.value && styles.selectedCategoryText
                  ]}>
                    {item.label}
                  </Text>
                  {category === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const selectedCategoryData = getSelectedCategoryData();

  return (
    
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💸 Add New Expense</Text>
        <Text style={styles.headerSubtitle}>Track your spending</Text>
      </View>
    
      <View style={styles.content}>
        {/* Amount Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>Rs.</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Category Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📁 Category</Text>
          <TouchableOpacity
            style={[
              styles.categorySelector,
              selectedCategoryData && { borderColor: selectedCategoryData.color }
            ]}
            onPress={() => setShowCategoryModal(true)}
          >
            {selectedCategoryData ? (
              <View style={styles.selectedCategoryDisplay}>
                <View style={[styles.miniCategoryIcon, { backgroundColor: selectedCategoryData.color }]}>
                  <Text style={styles.miniCategoryIconText}>{selectedCategoryData.icon}</Text>
                </View>
                <Text style={styles.selectedCategoryDisplayText}>
                  {selectedCategoryData.label}
                </Text>
              </View>
            ) : (
              <Text style={styles.placeholderText}>Select a category</Text>
            )}
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Note Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note about this expense..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save Button */}
      {/* Save Only Button */}
<TouchableOpacity 
  style={styles.saveButton} 
  onPress={() => saveExpense(false)}
>
  <Text style={styles.saveButtonText}>💾 Save & Add Another</Text>
</TouchableOpacity>

{/* Save and Go Home Button */}
<TouchableOpacity 
  style={styles.homeButton} 
  onPress={() => saveExpense(true)}
>
  <Text style={styles.homeButtonText}>🏠 Save & Go Home</Text>
</TouchableOpacity>


        {/* Cancel Button */}
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <CustomCategoryPicker />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
   
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    marginTop: -10,
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5352ed',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    padding: 15,
    color: '#2c3e50',
  },
  categorySelector: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCategoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniCategoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  miniCategoryIconText: {
    fontSize: 16,
  },
  selectedCategoryDisplayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  noteInput: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: '#2ed573',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },homeButton: {
    backgroundColor: '#2ed573',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  homeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '85%',
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  selectedCategoryItem: {
    backgroundColor: '#f0f8ff',
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#5352ed',
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 20,
    color: '#2ed573',
    fontWeight: 'bold',
  },
});