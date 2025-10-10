import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  children: any;
  fallback?: any;
}

// Simplified ErrorBoundary for React 19 compatibility
export function ErrorBoundary({ children, fallback }: Props) {
  try {
    return children;
  } catch (error) {
    console.error('ErrorBoundary caught an error:', error);
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          We apologize for the inconvenience. Please restart the app.
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#F44336',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
  },
});