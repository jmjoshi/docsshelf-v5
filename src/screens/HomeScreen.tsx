// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';

const HomeScreen = ({ navigation }: any) => {
  const { user } = useSelector((state: any) => state.auth);

  const features = [
    {
      id: 'upload',
      title: 'Upload Document',
      description: 'Upload and encrypt documents',
      icon: '⬆️',
      route: 'DocumentUpload',
      available: true,
    },
    {
      id: 'categories',
      title: 'Categories',
      description: 'Manage document categories and folders',
      icon: '📁',
      route: 'CategoryManagement',
      available: true,
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Browse and manage your documents',
      icon: '📄',
      route: 'Documents',
      available: true,
    },
    {
      id: 'scanner',
      title: 'Document Scanner',
      description: 'Scan documents with your camera',
      icon: '📷',
      route: 'Scanner',
      available: false,
    },
    {
      id: 'search',
      title: 'Search',
      description: 'Search documents with OCR',
      icon: '🔍',
      route: 'Search',
      available: false,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.firstName || 'User'}!</Text>
        <Text style={styles.subtitle}>What would you like to do today?</Text>
      </View>

      <View style={styles.featuresGrid}>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={[
              styles.featureCard,
              !feature.available && styles.featureCardDisabled,
            ]}
            onPress={() => {
              if (feature.available && navigation) {
                navigation.navigate(feature.route);
              }
            }}
            disabled={!feature.available}
          >
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
            {!feature.available && (
              <Text style={styles.comingSoon}>Coming Soon</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Documents</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Scanned</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: '1%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureCardDisabled: {
    opacity: 0.5,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  comingSoon: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '600',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
});

export default HomeScreen;
