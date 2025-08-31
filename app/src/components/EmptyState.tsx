import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';

export const EmptyState: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🛍️</Text>
      <Text style={styles.title}>Your wishlist is empty</Text>
      <Text style={styles.subtitle}>
        Start building your collection by adding items from your favorite stores
      </Text>
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/add')}
        accessibilityLabel="Add your first item to wishlist"
        accessibilityRole="button"
      >
        <Text style={styles.addButtonText}>Add Your First Item</Text>
      </TouchableOpacity>

      <View style={styles.hintContainer}>
        <Text style={styles.hintTitle}>💡 Pro Tip</Text>
        <Text style={styles.hintText}>
          You can also use deep links:{'\n'}
          <Text style={styles.codeText}>centscape://add?url=https://amazon.com</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 32,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  hintContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    width: '100%',
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  codeText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    backgroundColor: '#e9ecef',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
});