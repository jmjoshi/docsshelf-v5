import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to DocsShelf</Text>
      <Text style={styles.message}>Home screen placeholder - Core features coming in Phase 3</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
});