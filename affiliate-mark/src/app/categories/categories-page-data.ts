import { Category, Product, Subcategory } from '../models/mock-data.models';

export interface CategoryPageItem {
  category: Category;
  activeProductCount: number;
  subcategories: Array<{
    subcategory: Subcategory;
    activeProductCount: number;
  }>;
}

export function buildCategoriesPage(categories: Category[], products: Product[]): CategoryPageItem[] {
  const activeProducts = products.filter(product => product.isActive);
  return categories.map(category => ({
    category,
    activeProductCount: activeProducts.filter(product => product.categoryId === category.id).length,
    subcategories: category.subcategories.map(subcategory => ({
      subcategory,
      activeProductCount: activeProducts.filter(product =>
        product.categoryId === category.id && product.subcategoryId === subcategory.id
      ).length
    }))
  }));
}
