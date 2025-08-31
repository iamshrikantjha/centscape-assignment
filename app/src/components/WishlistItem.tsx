import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { WishlistItem as WishlistItemType } from '../services/DatabaseService';

interface Props {
  item: WishlistItemType;
  onDelete: (id: string) => void;
}

export const WishlistItem: React.FC<Props> = ({ item, onDelete }) => {
  const handleLongPress = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to remove "${item.title}" from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onLongPress={handleLongPress}
      accessibilityLabel={`Wishlist item: ${item.title}. Price: ${item.price ? `${item.currency} ${item.price}` : 'Not available'}. From ${item.siteName}. Added ${formatDate(item.createdAt)}. Long press to delete.`}
      accessibilityRole="button"
      accessibilityHint="Long press to delete this item"
    >
      <Image
        source={{ 
          uri: item.image || 'https://via.placeholder.com/80x80/f0f0f0/999?text=No+Image'
        }}
        style={styles.image}
        transition={200}
        recyclingKey={item.id}
        placeholder="https://via.placeholder.com/80x80/f0f0f0/999?text=Loading"
      />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.price}>
          {item.price ? `${item.currency || 'USD'} ${item.price}` : 'Price not available'}
        </Text>
        <Text style={styles.source} numberOfLines={1}>
          📍 {item.siteName}
        </Text>
        <Text style={styles.date}>
          🕒 {formatDate(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 20,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  source: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
});