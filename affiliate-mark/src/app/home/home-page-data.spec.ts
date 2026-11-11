import { Category, Coupon, Deal, Product } from '../models/mock-data.models';
import { buildHomePageData } from './home-page-data';

describe('buildHomePageData', () => {
  const product = (id: string, isFeatured: boolean, isActive = true): Product => ({
    id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    description: 'Mock product',
    brand: 'Mock brand',
    categoryId: 'category-test',
    subcategoryId: 'subcategory-test',
    image: 'assets/products/test.jpg',
    gallery: ['assets/products/test.jpg'],
    price: 1000,
    originalPrice: 1200,
    currency: 'INR',
    rating: 4,
    reviewCount: 10,
    affiliate: { platform: 'Amazon', url: 'https://example.com' },
    couponIds: [],
    dealIds: [],
    isFeatured,
    isActive,
    createdAt: '2026-01-01T00:00:00Z'
  });

  const category: Category = {
    id: 'category-test',
    name: 'Test',
    slug: 'test',
    icon: 'tag',
    image: 'assets/images/test.jpg',
    subcategories: [{ id: 'subcategory-test', name: 'Test', slug: 'test' }]
  };

  const deal = (id: string, productId: string, status: Deal['status'], validUntil: string): Deal => ({
    id,
    productId,
    title: `Deal ${id}`,
    dealType: 'special_offer',
    discountType: 'fixed',
    discountValue: 100,
    description: 'Mock deal',
    validFrom: '2026-11-01T00:00:00Z',
    validUntil,
    status
  });

  const coupon = (id: string, productId: string, status: Coupon['status'], validUntil: string): Coupon => ({
    id,
    productId,
    code: id,
    title: `Coupon ${id}`,
    description: 'Mock coupon',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 100,
    minimumPurchase: 500,
    validFrom: '2026-11-01T00:00:00Z',
    validUntil,
    terms: 'Mock terms',
    status
  });

  it('keeps only active, currently valid offers matched to active products', () => {
    const products = [
      product('1', true),
      product('2', false, false),
      product('3', true)
    ];
    const data = buildHomePageData(
      [category],
      products,
      [
        deal('active', '1', 'active', '2026-12-01T00:00:00Z'),
        deal('expired-date', '1', 'active', '2026-11-01T00:00:00Z'),
        deal('inactive-product', '2', 'active', '2026-12-01T00:00:00Z'),
        deal('upcoming', '3', 'upcoming', '2026-12-01T00:00:00Z')
      ],
      [
        coupon('active', '1', 'active', '2026-12-01T00:00:00Z'),
        coupon('expired', '1', 'expired', '2026-11-01T00:00:00Z')
      ],
      Date.parse('2026-11-11T00:00:00Z')
    );

    expect(data.categories).toEqual([category]);
    expect(data.trendingProducts.map(item => item.id)).toEqual(['1', '3']);
    expect(data.activeDeals.map(item => item.deal.id)).toEqual(['active']);
    expect(data.activeCoupons.map(item => item.coupon.id)).toEqual(['active']);
  });

  it('limits each home section to four records', () => {
    const products = Array.from({ length: 6 }, (_, index) => product(`${index}`, true));
    const deals = products.map(item => deal(`deal-${item.id}`, item.id, 'active', '2026-12-01T00:00:00Z'));
    const coupons = products.map(item => coupon(`coupon-${item.id}`, item.id, 'active', '2026-12-01T00:00:00Z'));
    const data = buildHomePageData(
      [category],
      products,
      deals,
      coupons,
      Date.parse('2026-11-11T00:00:00Z')
    );

    expect(data.trendingProducts).toHaveLength(4);
    expect(data.activeDeals).toHaveLength(4);
    expect(data.activeCoupons).toHaveLength(4);
  });
});
