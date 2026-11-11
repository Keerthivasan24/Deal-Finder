import { Category, Product } from '../models/mock-data.models';
import { buildCategoriesPage } from './categories-page-data';

describe('buildCategoriesPage', () => {
  const categories: Category[] = [{
    id: 'electronics',
    name: 'Electronics',
    slug: 'electronics',
    icon: 'monitor-smartphone',
    image: 'assets/images/categories/electronics.jpg',
    subcategories: [
      { id: 'phones', name: 'Phones', slug: 'phones' },
      { id: 'audio', name: 'Audio', slug: 'audio' }
    ]
  }];
  const product = (id: string, subcategoryId: string, isActive = true): Product => ({
    id,
    name: id,
    slug: id,
    description: '',
    brand: '',
    categoryId: 'electronics',
    subcategoryId,
    image: '',
    gallery: [],
    price: 10,
    originalPrice: 10,
    currency: 'INR',
    rating: 4,
    reviewCount: 0,
    affiliate: { platform: 'Amazon', url: 'https://example.com' },
    couponIds: [],
    dealIds: [],
    isFeatured: false,
    isActive,
    createdAt: ''
  });

  it('counts only active products for each category and subcategory', () => {
    const result = buildCategoriesPage(categories, [
      product('one', 'phones'),
      product('two', 'phones'),
      product('three', 'audio'),
      product('inactive', 'phones', false)
    ]);

    expect(result[0].activeProductCount).toBe(3);
    expect(result[0].subcategories.map(item => item.activeProductCount)).toEqual([2, 1]);
  });
});
