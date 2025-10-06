// @ts-nocheck
/**
 * CategoryManagementScreen - Manage document categories and folders
 * Allows users to create, edit, delete categories with hierarchical structure
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import DatabaseService, { Category } from '../../services/database/DatabaseService';
import {
  setCategories,
  addCategory as addCategoryAction,
  updateCategory as updateCategoryAction,
  removeCategory as removeCategoryAction,
  setLoading,
  setError,
} from '../../store/slices/documentSlice';

const CATEGORY_ICONS = ['folder', 'file-text', 'briefcase', 'home', 'heart', 'star', 'tag'];
const CATEGORY_COLORS = ['#4A90E2', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#34495E'];

export default function CategoryManagementScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const { categories, loading } = useSelector((state: any) => state.document);
  const { user } = useSelector((state: any) => state.auth);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedColor, setSelectedColor] = useState('#4A90E2');
  const [selectedParent, setSelectedParent] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    if (!user) return;

    try {
      dispatch(setLoading(true));
      const allCategories = await DatabaseService.getCategoryTree(user.id);
      dispatch(setCategories(allCategories));
    } catch (error) {
      console.error('Failed to load categories:', error);
      dispatch(setError('Failed to load categories'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const openCreateModal = (parentId: string | null = null) => {
    setEditingCategory(null);
    setCategoryName('');
    setSelectedIcon('folder');
    setSelectedColor('#4A90E2');
    setSelectedParent(parentId);
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setSelectedParent(category.parentId);
    setModalVisible(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      dispatch(setLoading(true));

      if (editingCategory) {
        // Update existing category
        await DatabaseService.updateCategory(editingCategory.id, {
          name: categoryName.trim(),
          icon: selectedIcon,
          color: selectedColor,
          parentId: selectedParent,
        });

        const updated = await DatabaseService.getCategoryById(editingCategory.id);
        if (updated) {
          dispatch(updateCategoryAction(updated));
        }
      } else {
        // Create new category
        const newCategory = await DatabaseService.createCategory({
          name: categoryName.trim(),
          icon: selectedIcon,
          color: selectedColor,
          parentId: selectedParent,
          userId: user.id,
        });

        dispatch(addCategoryAction(newCategory));
      }

      setModalVisible(false);
      Alert.alert('Success', `Category ${editingCategory ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Failed to save category:', error);
      Alert.alert('Error', 'Failed to save category');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This will also delete all subcategories and documents.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              dispatch(setLoading(true));
              await DatabaseService.deleteCategory(category.id);
              dispatch(removeCategoryAction(category.id));
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error) {
              console.error('Failed to delete category:', error);
              Alert.alert('Error', 'Failed to delete category');
            } finally {
              dispatch(setLoading(false));
            }
          },
        },
      ]
    );
  };

  const renderCategory = (category: Category, depth: number = 0) => {
    const subcategories = categories.filter((cat: Category) => cat.parentId === category.id);

    return (
      <View key={category.id}>
        <TouchableOpacity
          style={[styles.categoryItem, { marginLeft: depth * 20 }]}
          onPress={() => navigation.navigate('Documents', { categoryId: category.id })}
        >
          <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
            <Text style={styles.iconText}>📁</Text>
          </View>
          <Text style={styles.categoryName}>{category.name}</Text>
          <View style={styles.categoryActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openCreateModal(category.id)}
            >
              <Text style={styles.actionButtonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEditModal(category)}
            >
              <Text style={styles.actionButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteCategory(category)}
            >
              <Text style={styles.actionButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        {subcategories.map((subcat: Category) => renderCategory(subcat, depth + 1))}
      </View>
    );
  };

  const rootCategories = categories.filter((cat: Category) => !cat.parentId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openCreateModal()}
        >
          <Text style={styles.addButtonText}>+ New Category</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading categories...</Text>
        </View>
      ) : rootCategories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No categories yet</Text>
          <Text style={styles.emptySubtext}>Create your first category to organize documents</Text>
        </View>
      ) : (
        <ScrollView style={styles.categoriesList}>
          {rootCategories.map((category: Category) => renderCategory(category))}
        </ScrollView>
      )}

      {/* Category Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Category Name"
              value={categoryName}
              onChangeText={setCategoryName}
              autoFocus
            />

            <Text style={styles.sectionLabel}>Icon</Text>
            <View style={styles.iconGrid}>
              {CATEGORY_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && styles.iconOptionSelected,
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Text style={styles.iconOptionText}>📁</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveCategory}
              >
                <Text style={styles.saveButtonText}>
                  {editingCategory ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  categoriesList: {
    flex: 1,
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  actionButtonText: {
    fontSize: 14,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  iconOption: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#F5F5F5',
  },
  iconOptionSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#E3F2FD',
  },
  iconOptionText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#333333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
