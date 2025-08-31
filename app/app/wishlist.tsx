import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  DatabaseService,
  WishlistItem,
} from "./../src/services/DatabaseService";
import { LoadingSkeleton } from "../src/components/LoadingSkeleton";

const { width } = Dimensions.get("window");

export default function WishlistScreen() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWishlistItems = useCallback(async () => {
    try {
      // Ensure DB is initialized before queries
      await DatabaseService.initializeDatabase();

      const wishlistItems = await DatabaseService.getWishlistItems();
      setItems(wishlistItems);
    } catch (error) {
      console.error("Failed to load wishlist items:", error);
      Alert.alert("Error", "Failed to load wishlist items");
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWishlistItems();
    setRefreshing(false);
  }, [loadWishlistItems]);

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        await DatabaseService.initializeDatabase();
        await DatabaseService.deleteWishlistItem(id);
        await loadWishlistItems();
      } catch (error) {
        console.error("Failed to delete item:", error);
        Alert.alert("Error", "Failed to delete item");
      }
    },
    [loadWishlistItems]
  );

  const confirmDelete = useCallback(
    (item: WishlistItem) => {
      Alert.alert(
        "Delete Item",
        `Are you sure you want to remove "${item.title}" from your wishlist?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteItem(item.id),
          },
        ]
      );
    },
    [deleteItem]
  );

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWishlistItems();
    }, [loadWishlistItems])
  );

  useEffect(() => {
    loadWishlistItems();
  }, [loadWishlistItems]);

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onLongPress={() => confirmDelete(item)}
      accessibilityLabel={`Wishlist item: ${item.title}. Long press to delete.`}
      accessibilityRole="button"
    >
      <Image
        source={{
          uri:
            item.image ||
            "https://via.placeholder.com/80x80/f0f0f0/999?text=No+Image",
        }}
        style={styles.itemImage}
        transition={200}
        recyclingKey={item.id}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.itemPrice}>
          {item.price ? `${item.currency || "USD"} ${item.price}` : "N/A"}
        </Text>
        <Text style={styles.itemSource} numberOfLines={1}>
          {item.siteName}
        </Text>
        <Text style={styles.itemDate}>
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🛍️</Text>
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptySubtitle}>
        Add items by tapping the + button below or use deep links like:
        {"\n"}centscape://add?url=https://amazon.com
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/add")}
        accessibilityLabel="Add first item to wishlist"
        accessibilityRole="button"
      >
        <Text style={styles.addButtonText}>Add Your First Item</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LoadingSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <FlatList
        data={items}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          items.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
        getItemLayout={(data, index) => ({
          length: 116, // Approximate item height
          offset: 116 * index,
          index,
        })}
      />

      {items.length > 0 && (
        <TouchableOpacity
          style={styles.floatingAddButton}
          onPress={() => router.push("/add")}
          accessibilityLabel="Add new item to wishlist"
          accessibilityRole="button"
        >
          <Text style={styles.floatingAddButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  list: {
    padding: 16,
    paddingBottom: 100, // Space for floating button
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  itemContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 4,
  },
  itemSource: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  floatingAddButton: {
    position: "absolute",
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingAddButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "300",
  },
});
