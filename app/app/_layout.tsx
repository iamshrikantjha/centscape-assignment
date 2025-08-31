import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { DatabaseService } from '../src/services/DatabaseService';

export default function RootLayout() {
  useEffect(() => {
    // Initialize database on app start
    DatabaseService.initializeDatabase().catch(console.error);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="wishlist" 
        options={{ 
          title: 'My Wishlist',
          headerBackVisible: false
        }} 
      />
      <Stack.Screen 
        name="add" 
        options={{ 
          title: 'Add Item',
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}