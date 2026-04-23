/**
 * Category Utility Functions
 * Helper functions for processing and transforming category data
 */

import type { Category } from '@/services/api';

/**
 * Flatten nested categories into a single array
 * Useful for search, filter, or display purposes where you need all categories
 * 
 * @param categories - Array of categories with nested subCategories
 * @returns Flattened array of all categories (parent and sub)
 */
export const flattenCategories = (categories: Category[]): Category[] => {
  const flattened: Category[] = [];

  const flatten = (cats: Category[]) => {
    cats.forEach((category) => {
      flattened.push(category);
      if (category.subCategories && category.subCategories.length > 0) {
        flatten(category.subCategories);
      }
    });
  };

  flatten(categories);
  return flattened;
};

/**
 * Get only parent categories (ones that have subCategories)
 * 
 * @param categories - Array of categories
 * @returns Only parent categories
 */
export const getParentCategories = (categories: Category[]): Category[] => {
  return categories.filter((category) => category.subCategories && category.subCategories.length > 0);
};

/**
 * Find a category by ID (searches in hierarchy)
 * 
 * @param categories - Array of categories to search
 * @param categoryId - ID to search for
 * @returns Category if found, undefined otherwise
 */
export const findCategoryById = (categories: Category[], categoryId: string): Category | undefined => {
  for (const category of categories) {
    if (category.categoryId === categoryId) {
      return category;
    }
    if (category.subCategories && category.subCategories.length > 0) {
      const found = findCategoryById(category.subCategories, categoryId);
      if (found) return found;
    }
  }
  return undefined;
};

/**
 * Get all subcategories for a parent category by ID
 * 
 * @param categories - Array of categories
 * @param parentId - ID of parent category
 * @returns Array of subcategories
 */
export const getSubcategoriesByParentId = (
  categories: Category[],
  parentId: string
): Category[] => {
  const parent = findCategoryById(categories, parentId);
  return parent?.subCategories || [];
};

/**
 * Filter categories by search term (searches name and description)
 * 
 * @param categories - Array of categories
 * @param searchTerm - String to search for
 * @returns Filtered categories
 */
export const searchCategories = (categories: Category[], searchTerm: string): Category[] => {
  const term = searchTerm.toLowerCase();
  const flattened = flattenCategories(categories);
  
  return flattened.filter((category) => {
    const nameMatches = category.name.toLowerCase().includes(term);
    const descriptionMatches = category.description?.toLowerCase().includes(term);
    return nameMatches || descriptionMatches;
  });
};

/**
 * Get only active categories
 * 
 * @param categories - Array of categories
 * @returns Only active categories
 */
export const getActiveCategories = (categories: Category[]): Category[] => {
  return categories.filter((category) => category.isActive);
};

/**
 * Count total categories including subcategories
 * 
 * @param categories - Array of categories
 * @returns Total count
 */
export const countAllCategories = (categories: Category[]): number => {
  return flattenCategories(categories).length;
};

/**
 * Get category hierarchy level
 * Returns how deep a category is in the hierarchy
 * 
 * @param categories - Array of categories
 * @param categoryId - ID of category to check
 * @returns Level (0 for parent, 1+ for nested)
 */
export const getCategoryLevel = (categories: Category[], categoryId: string): number => {
  const checkLevel = (cats: Category[], id: string, level: number): number => {
    for (const category of cats) {
      if (category.categoryId === id) {
        return level;
      }
      if (category.subCategories && category.subCategories.length > 0) {
        const result = checkLevel(category.subCategories, id, level + 1);
        if (result !== -1) return result;
      }
    }
    return -1;
  };

  return checkLevel(categories, categoryId, 0);
};
