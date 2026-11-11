import { Category, Coupon, Deal, Product } from '../models/mock-data.models';
import { buildProductDetailsData } from './product-details-data';

describe('buildProductDetailsData', () => {
  const category: Category = {
    id: 'cat',
    name: 'Electronics',
    slug: 'electronics',
    icon: 'devices',
    image: 'assets/images/categories/electronics.jpg',
    subcategories: [{ id: 'sub', name: 'Phones', slug: 'phones' }]
  };

  const product = (id: string, active = true): Product => ({
    id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    description: 'Description',
    brand: 'Brand',
    categoryId: 'cat',
    subcategoryId: 'sub',
    image: `assets/products/${id}.jpg`,
    gallery: [`assets/products/${id}.jpg`],
    price: 900,
    originalPrice: 1000,
    currency: 'INR',
    rating: 4.2,
    reviewCount: 30,
    affiliate: { platform: 'Amazon', url: 'https://example.com' },
    couponIds: ['coupon-active', 'coupon-expired'],
    dealIds: ['deal-active', 'deal-upcoming'],
    isFeatured: false,
    isActive: active,
    createdAt: '2026-01-01T00:00:00Z'
  });

  const coupon = (id: string, validUntil: string): Coupon => ({
    id,
    productId: 'one',
    code: id,
    title: id,
    description: id,
    discountType: 'fixed',
    discountValue: 100,
    maxDiscount: 100,
    minimumPurchase: 0,
    validFrom: '2026-11-01T00:00:00Z',
    validUntil,
    terms: 'Terms',
    status: 'active'
  });

  const deal = (id: string, status: Deal['status'], validFrom: string): Deal => ({
    id,
    productId: 'one',
    title: id,
    dealType: 'special_offer',
    discountType: 'percentage',
    discountValue: 10,
    description: id,
    validFrom,
    validUntil: '2026-11-30T00:00:00Z',
    status
  });

  it('returns an active product with only currently valid referenced offers and related products', () => {
    const data = buildProductDetailsData(
      'one',
      [category],
      [product('one'), product('two'), product('three'), product('four'), product('five'), product('six', false)],
      [
        deal('deal-active', 'active', '2026-11-01T00:00:00Z'),
        deal('deal-upcoming', 'upcoming', '2026-11-20T00:00:00Z')
      ],
      [
        coupon('coupon-active', '2026-11-30T00:00:00Z'),
        coupon('coupon-expired', '2026-11-01T00:00:00Z')
      ],
      Date.parse('2026-11-11T00:00:00Z')
    );

    expect(data?.category.name).toBe('Electronics');
    expect(data?.subcategory?.name).toBe('Phones');
    expect(data?.coupons.map(item => item.id)).toEqual(['coupon-active']);
    expect(data?.deals.map(item => item.id)).toEqual(['deal-active']);
    expect(data?.relatedProducts.map(item => item.id)).toEqual(['two', 'three', 'four', 'five']);
  });

  it('returns null for missing or inactive products', () => {
    expect(buildProductDetailsData('missing', [category], [product('one')], [], [], 0)).toBeNull();
    expect(buildProductDetailsData('one', [category], [product('one', false)], [], [], 0)).toBeNull();
  });
});
