import { Coupon, Deal, Product } from '../models/mock-data.models';
import { buildOffersPage } from './offers-page-data';

describe('buildOffersPage', () => {
  const product = (id: string, isActive = true, isFeatured = false): Product => ({
    id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    description: 'Description',
    brand: 'Brand',
    categoryId: 'category',
    subcategoryId: 'subcategory',
    image: `assets/products/${id}.jpg`,
    gallery: [],
    price: 1000,
    originalPrice: 1200,
    currency: 'INR',
    rating: 4.5,
    reviewCount: 10,
    affiliate: { platform: 'Amazon', url: 'https://example.com' },
    couponIds: [],
    dealIds: [],
    isFeatured,
    isActive,
    createdAt: '2026-01-01T00:00:00Z'
  });

  const deal = (id: string, productId: string, status: Deal['status'] = 'active'): Deal => ({
    id,
    productId,
    title: `Deal ${id}`,
    dealType: 'price_discount',
    discountType: 'percentage',
    discountValue: 20,
    description: 'Description',
    validFrom: '2026-11-01T00:00:00Z',
    validUntil: '2026-11-30T23:59:59Z',
    status
  });

  const coupon = (id: string, productId: string, code: string): Coupon => ({
    id,
    productId,
    code,
    title: `Coupon ${id}`,
    description: 'Description',
    discountType: 'fixed',
    discountValue: 100,
    maxDiscount: 100,
    minimumPurchase: 500,
    validFrom: '2026-11-01T00:00:00Z',
    validUntil: '2026-11-30T23:59:59Z',
    terms: 'Terms',
    status: 'active'
  });

  const now = Date.parse('2026-11-11T00:00:00Z');

  it('filters invalid dates, inactive products, missing references and searches deals', () => {
    const result = buildOffersPage(
      'deals',
      [product('one', true, true), product('inactive', false)],
      [
        deal('valid', 'one'),
        deal('invalid-product', 'missing'),
        deal('inactive-product', 'inactive'),
        deal('upcoming', 'one', 'upcoming'),
        { ...deal('expired-range', 'one'), validUntil: '2026-11-10T23:59:59Z' }
      ],
      [],
      { q: 'PRODUCT ONE', sort: 'newest' },
      now
    );
    expect(result.total).toBe(1);
    expect(result.deals.map(item => item.deal.id)).toEqual(['valid']);
  });

  it('searches coupons by code and applies the featured ordering', () => {
    const result = buildOffersPage(
      'coupons',
      [product('one', true, false), product('two', true, true)],
      [],
      [coupon('first', 'one', 'SAVE100'), coupon('second', 'two', 'SAVE200')],
      { q: 'save200', sort: 'featured' },
      now
    );
    expect(result.total).toBe(1);
    expect(result.coupons[0].coupon.id).toBe('second');
  });

  it('filters coupons independently and excludes coupons outside their validity dates', () => {
    const result = buildOffersPage(
      'coupons',
      [product('one')],
      [deal('deal', 'one')],
      [
        coupon('valid', 'one', 'VALID'),
        { ...coupon('expired-range', 'one', 'OLD'), validUntil: '2026-11-10T23:59:59Z' }
      ],
      {},
      now
    );
    expect(result.total).toBe(1);
    expect(result.coupons.map(item => item.coupon.id)).toEqual(['valid']);
    expect(result.deals).toEqual([]);
  });
});
