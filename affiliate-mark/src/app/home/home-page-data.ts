import {
  Category,
  Coupon,
  Deal,
  HomePageData,
  Product,
  ProductCoupon,
  ProductDeal
} from '../models/mock-data.models';

export function buildHomePageData(
  categories: Category[],
  products: Product[],
  deals: Deal[],
  coupons: Coupon[],
  now = Date.now()
): HomePageData {
  const productById = new Map(products.map(product => [product.id, product]));
  const isCurrentlyValid = (offer: Coupon | Deal): boolean =>
    offer.status === 'active' &&
    Date.parse(offer.validFrom) <= now &&
    Date.parse(offer.validUntil) >= now;

  const activeDeals: ProductDeal[] = deals
    .filter(isCurrentlyValid)
    .flatMap(deal => {
      const product = productById.get(deal.productId);
      return product?.isActive ? [{ deal, product }] : [];
    })
    .slice(0, 4);

  const activeCoupons: ProductCoupon[] = coupons
    .filter(isCurrentlyValid)
    .flatMap(coupon => {
      const product = productById.get(coupon.productId);
      return product?.isActive ? [{ coupon, product }] : [];
    })
    .slice(0, 4);

  return {
    categories,
    trendingProducts: products
      .filter(product => product.isActive && product.isFeatured)
      .slice(0, 4),
    activeDeals,
    activeCoupons
  };
}
