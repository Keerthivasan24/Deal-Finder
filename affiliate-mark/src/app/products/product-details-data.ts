import {
  Category,
  Coupon,
  Deal,
  Product,
  ProductDetailsData
} from '../models/mock-data.models';

export function buildProductDetailsData(
  productId: string,
  categories: Category[],
  products: Product[],
  deals: Deal[],
  coupons: Coupon[],
  now = Date.now()
): ProductDetailsData | null {
  const product = products.find(item => item.id === productId && item.isActive);
  if (!product) return null;

  const category = categories.find(item => item.id === product.categoryId);
  if (!category) return null;

  const isCurrentlyValid = (offer: Coupon | Deal): boolean =>
    offer.status === 'active' &&
    Date.parse(offer.validFrom) <= now &&
    Date.parse(offer.validUntil) >= now;

  return {
    product,
    category,
    subcategory: category.subcategories.find(item => item.id === product.subcategoryId) ?? null,
    coupons: coupons.filter(coupon =>
      product.couponIds.includes(coupon.id) &&
      coupon.productId === product.id &&
      isCurrentlyValid(coupon)
    ),
    deals: deals.filter(deal =>
      product.dealIds.includes(deal.id) &&
      deal.productId === product.id &&
      isCurrentlyValid(deal)
    ),
    relatedProducts: products
      .filter(item => item.isActive && item.categoryId === product.categoryId && item.id !== product.id)
      .slice(0, 4)
  };
}
