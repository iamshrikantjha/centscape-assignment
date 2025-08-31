import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DatabaseService } from '../src/services/DatabaseService';
import { PreviewService, PreviewData } from '../src/services/PreviewService';
import { LoadingSkeleton } from '../src/components/LoadingSkeleton';

export default function AddItemScreen() {
  const { url: deepLinkUrl } = useLocalSearchParams<{ url?: string }>();
  
  const [url, setUrl] = useState(deepLinkUrl || '');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (deepLinkUrl) {
      fetchPreview(deepLinkUrl);
    }
  }, [deepLinkUrl]);

  const validateUrl = (inputUrl: string): boolean => {
    try {
      const url = new URL(inputUrl);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  };

  const fetchPreview = async (inputUrl: string) => {
    const trimmedUrl = inputUrl.trim();
    
    if (!trimmedUrl) {
      setPreview(null);
      return;
    }

    if (!validateUrl(trimmedUrl)) {
      Alert.alert('Invalid URL', 'Please enter a valid HTTP or HTTPS URL');
      return;
    }

    setLoading(true);
    try {
      const previewData = await PreviewService.fetchPreview(trimmedUrl);
      setPreview(previewData);
    } catch (error) {
      console.error('Preview fetch error:', error);
      Alert.alert(
        'Preview Error',
        error instanceof Error ? error.message : 'Failed to fetch preview',
        [
          { text: 'OK' },
          { text: 'Retry', onPress: () => fetchPreview(trimmedUrl) }
        ]
      );
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = () => {
    fetchPreview(url);
  };

  const testNetworkConnection = async () => {
    try {
      console.log('🔍 Testing network connection...');
      const results = await PreviewService.testNetworkConnectivity();
      const serverUrl = Object.keys(results)[0];
      const isConnected = results[serverUrl];
      
      Alert.alert(
        'Network Test',
        `Server: ${serverUrl}\nStatus: ${isConnected ? '✅ Connected' : '❌ Failed'}\n\nIf connection failed, check:\n• Server is running\n• Same network\n• Firewall settings`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Network Test Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const addToWishlist = async () => {
    if (!preview) return;

    setSaving(true);
    try {
      // Check for duplicates
      const normalizedUrl = DatabaseService.normalizeUrl(preview.sourceUrl);
      const existingItem = await DatabaseService.findItemByNormalizedUrl(normalizedUrl);
      
      if (existingItem) {
        Alert.alert(
          'Duplicate Item',
          'This item is already in your wishlist!',
          [
            { text: 'OK' },
            { text: 'View Wishlist', onPress: () => router.push('/wishlist') }
          ]
        );
        return;
      }

      await DatabaseService.addWishlistItem({
        title: preview.title,
        image: preview.image,
        price: preview.price,
        currency: preview.currency,
        siteName: preview.siteName,
        sourceUrl: preview.sourceUrl,
        normalizedUrl,
      });

      Alert.alert(
        'Success! 🎉',
        'Item added to your wishlist!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Add to wishlist error:', error);
      Alert.alert('Error', 'Failed to add item to wishlist');
    } finally {
      setSaving(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setUrl('');
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Loading Preview...</Text>
          <LoadingSkeleton />
        </View>
      );
    }

    if (!preview) {
      return null;
    }

    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Preview</Text>
          <TouchableOpacity
            onPress={clearPreview}
            style={styles.clearButton}
            accessibilityLabel="Clear preview"
          >
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.previewCard}>
          <Image
            source={{ 
              uri: preview.image || 'https://via.placeholder.com/120x120/f0f0f0/999?text=No+Image'
            }}
            style={styles.previewImage}
            transition={200}
          />
          <View style={styles.previewDetails}>
            <Text style={styles.previewItemTitle} numberOfLines={3}>
              {preview.title}
            </Text>
            <Text style={styles.previewPrice}>
              {preview.price ? `${preview.currency || 'USD'} ${preview.price}` : 'Price not available'}
            </Text>
            <Text style={styles.previewSite} numberOfLines={1}>
              {preview.siteName}
            </Text>
            <Text style={styles.previewUrl} numberOfLines={1}>
              {preview.sourceUrl}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.addToWishlistButton, saving && styles.addButtonDisabled]}
          onPress={addToWishlist}
          disabled={saving}
          accessibilityLabel="Add item to wishlist"
          accessibilityRole="button"
        >
          {saving ? (
            <View style={styles.savingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.addButtonText}> Adding...</Text>
            </View>
          ) : (
            <Text style={styles.addButtonText}>Add to Wishlist</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Enter Product URL</Text>
          <Text style={styles.inputHint}>
            Paste any product link from Amazon, Shopify, or other stores
          </Text>
          
          <TextInput
            style={styles.urlInput}
            value={url}
            onChangeText={setUrl}
            placeholder="https://example.com/product"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handleUrlSubmit}
            accessibilityLabel="URL input field"
            selectTextOnFocus
          />
          
          <TouchableOpacity
            style={[
              styles.previewButton, 
              (loading || !url.trim()) && styles.previewButtonDisabled
            ]}
            onPress={handleUrlSubmit}
            disabled={loading || !url.trim()}
            accessibilityLabel="Fetch URL preview"
            accessibilityRole="button"
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.previewButtonText}> Getting Preview...</Text>
              </View>
            ) : (
              <Text style={styles.previewButtonText}>Get Preview</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.networkTestButton}
            onPress={testNetworkConnection}
            accessibilityLabel="Test network connection"
            accessibilityRole="button"
          >
            <Text style={styles.networkTestButtonText}>Test Connection</Text>
          </TouchableOpacity>
        </View>

        {renderPreview()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  inputSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fafafa',
    color: '#1a1a1a',
  },
  previewButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  previewButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  networkTestButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  networkTestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 20,
    color: '#666',
    lineHeight: 20,
  },
  previewCard: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  previewDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  previewItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 20,
  },
  previewPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  previewSite: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewUrl: {
    fontSize: 12,
    color: '#999',
  },
  addToWishlistButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});