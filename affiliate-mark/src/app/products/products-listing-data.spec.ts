import { Category, Coupon, Deal, Product } from '../models/mock-data.models';
import { buildProductListing } from './products-listing-data';

describe('buildProductListing', () => {
  const categories: Category[] = [
    { id: 'cat-a', name: 'Category A', slug: 'category-a', icon: 'tag', image: 'cat-a.jpg', subcategories: [] },
    { id: 'cat-b', name: 'Category B', slug: 'category-b', icon: 'tag', image: 'cat-b.jpg', subcategories: [] }
  ];

  const product = (
    id: string,
    categoryId: string,
    price: number,
    options: { featured?: boolean; active?: boolean; brand?: string; rating?: number; coupons?: string[]; deals?: string[] } = {}
  ): Product => ({
    id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    description: 'Mock product',
    brand: options.brand ?? 'Brand',
    categoryId,
    subcategoryId: `sub-${categoryId}`,
    image: 'assets/products/test.jpg',
    gallery: ['assets/products/test.jpg'],
    price,
    originalPrice: price + 100,
    currency: 'INR',
    rating: options.rating ?? 4,
    reviewCount: 20,
    affiliate: { platform: 'Amazon', url: 'https://example.com' },
    couponIds: options.coupons ?? [],
    dealIds: options.deals ?? [],
    isFeatured: options.featured ?? false,
    isActive: options.active ?? true,
    createdAt: '2026-01-01T00:00:00Z'
  });

  const coupon = (id: string, productId: string, status: Coupon['status'], validUntil: string): Coupon => ({
    id, productId, code: id, title: id, description: id, discountType: 'fixed',
    discountValue: 100, maxDiscount: 100, minimumPurchase: 0,
    validFrom: '2026-11-01T00:00:00Z', validUntil, terms: 'Test', status
  });

  const deal = (id: string, productId: string, status: Deal['status'], validUntil: string): Deal => ({
    id, productId, title: id, dealType: 'special_offer', discountType: 'fixed',
    discountValue: 100, description: id, validFrom: '2026-11-01T00:00:00Z',
    validUntil, status
  });

  const now = Date.parse('2026-11-11T00:00:00Z');
  const products = [
    product('one', 'cat-a', 300, { coupons: ['coupon-one'], deals: ['deal-one'], featured: true }),
    product('two', 'cat-a', 100, { coupons: ['coupon-two'] }),
    product('three', 'cat-b', 200, { deals: ['deal-three'], brand: 'Other', rating: 4.9 }),
    product('inactive', 'cat-b', 50, { active: false, coupons: ['expired-coupon'] })
  ];
  const coupons = [
    coupon('coupon-one', 'one', 'active', '2026-11-30T00:00:00Z'),
    coupon('coupon-two', 'two', 'expired', '2026-11-01T00:00:00Z'),
    coupon('expired-coupon', 'inactive', 'active', '2026-11-30T00:00:00Z')
  ];
  const deals = [
    deal('deal-one', 'one', 'active', '2026-11-30T00:00:00Z'),
    deal('deal-three', 'three', 'active', '2026-11-30T00:00:00Z')
  ];

  it('filters active offers by category, search, price and offer type together', () => {
    const listing = buildProductListing(
      categories, products, deals, coupons,
      { category: 'category-a', offer: 'coupons', q: 'brand', min: '250', max: '350' },
      now
    );

    expect(listing.totalProducts).toBe(1);
    expect(listing.products.map(item => item.product.id)).toEqual(['one']);
    expect(listing.products[0].hasCoupons).toBe(true);
    expect(listing.products[0].hasDeals).toBe(true);
  });

  it('includes products with both current offer types in each offer filter', () => {
    const couponsOnly = buildProductListing(categories, products, deals, coupons, { offer: 'coupons' }, now);
    const dealsOnly = buildProductListing(categories, products, deals, coupons, { offer: 'deals' }, now);

    expect(couponsOnly.products.map(item => item.product.id)).toEqual(['one']);
    expect(dealsOnly.products.map(item => item.product.id)).toEqual(['one', 'three']);
  });

  it('searches brand and sorts while excluding inactive products and invalid offers', () => {
    const search = buildProductListing(categories, products, deals, coupons, { q: 'other', sort: 'rating' }, now);
    const lowestPrice = buildProductListing(categories, products, deals, coupons, { sort: 'price-asc' }, now);

    expect(search.products.map(item => item.product.id)).toEqual(['three']);
    expect(lowestPrice.products.map(item => item.product.id)).toEqual(['two', 'three', 'one']);
    expect(lowestPrice.products.some(item => item.product.id === 'inactive')).toBe(false);
    expect(lowestPrice.products.find(item => item.product.id === 'two')?.hasCoupons).toBe(false);
  });

  it('supports price sorting in descending order and clamps pages after filtering', () => {
    const listing = buildProductListing(
      categories, products, deals, coupons,
      { sort: 'price-desc', category: 'cat-b', page: '99' },
      now
    );

    expect(listing.products.map(item => item.product.id)).toEqual(['three']);
    expect(listing.filters.page).toBe(1);
  });

  it('filters by a validated subcategory ID or slug together with its category', () => {
    const category: Category = {
      ...categories[0],
      subcategories: [{ id: 'sub-cat-a', name: 'Audio', slug: 'audio' }]
    };
    const categoryProducts = [
      { ...product('audio', 'cat-a', 100), subcategoryId: 'sub-cat-a' },
      { ...product('other', 'cat-a', 200), subcategoryId: 'sub-cat-a-other' }
    ];
    const byId = buildProductListing([category], categoryProducts, [], [], {
      category: 'cat-a',
      subcategory: 'sub-cat-a'
    }, now);
    const bySlug = buildProductListing([category], categoryProducts, [], [], {
      category: 'category-a',
      subcategory: 'audio'
    }, now);
    const invalid = buildProductListing([category], categoryProducts, [], [], {
      category: 'cat-a',
      subcategory: 'not-a-subcategory'
    }, now);

    expect(byId.products.map(item => item.product.id)).toEqual(['audio']);
    expect(bySlug.products.map(item => item.product.id)).toEqual(['audio']);
    expect(invalid.products.map(item => item.product.id)).toEqual(['audio', 'other']);
  });
});
