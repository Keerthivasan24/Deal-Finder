import { Coupon, Deal, Product } from '../models/mock-data.models';

export type OffersPageKind = 'deals' | 'coupons';
export type OffersSort = 'featured' | 'discount' | 'newest';

export interface DealOfferItem {
  deal: Deal;
  product: Product;
}

export interface CouponOfferItem {
  coupon: Coupon;
  product: Product;
}

export interface OffersPageViewModel {
  kind: OffersPageKind;
  deals: DealOfferItem[];
  coupons: CouponOfferItem[];
  total: number;
  search: string;
  sort: OffersSort;
}

export function buildOffersPage(
  kind: OffersPageKind,
  products: Product[],
  deals: Deal[],
  coupons: Coupon[],
  params: Record<string, string | null>,
  now = Date.now()
): OffersPageViewModel {
  const search = (params['q'] ?? '').trim();
  const rawSort = params['sort'];
  const sort: OffersSort =
    rawSort === 'discount' || rawSort === 'newest' ? rawSort : 'featured';
  const activeProducts = new Map(
    products.filter(product => product.isActive).map(product => [product.id, product])
  );
  const searchTerm = search.toLocaleLowerCase();

  const matchingDeals: DealOfferItem[] = deals
    .filter(deal => isCurrentlyValid(deal, now))
    .flatMap(deal => {
      const product = activeProducts.get(deal.productId);
      if (!product) return [];
      const item = { deal, product };
      return matchesSearch(searchTerm, deal.title, product.name) ? [item] : [];
    });

  const matchingCoupons: CouponOfferItem[] = coupons
    .filter(coupon => isCurrentlyValid(coupon, now))
    .flatMap(coupon => {
      const product = activeProducts.get(coupon.productId);
      if (!product) return [];
      const item = { coupon, product };
      return matchesSearch(searchTerm, coupon.title, coupon.code, product.name) ? [item] : [];
    });

  if (sort === 'featured') {
    matchingDeals.sort((a, b) =>
      Number(b.product.isFeatured) - Number(a.product.isFeatured) ||
      Date.parse(b.deal.validFrom) - Date.parse(a.deal.validFrom)
    );
    matchingCoupons.sort((a, b) =>
      Number(b.product.isFeatured) - Number(a.product.isFeatured) ||
      Date.parse(b.coupon.validFrom) - Date.parse(a.coupon.validFrom)
    );
  } else if (sort === 'discount') {
    matchingDeals.sort((a, b) =>
      discountPercent(b.deal.discountType, b.deal.discountValue, b.product.price) -
      discountPercent(a.deal.discountType, a.deal.discountValue, a.product.price)
    );
    matchingCoupons.sort((a, b) =>
      couponDiscountPercent(b.coupon, b.product.price) -
      couponDiscountPercent(a.coupon, a.product.price)
    );
  } else {
    matchingDeals.sort((a, b) => Date.parse(b.deal.validFrom) - Date.parse(a.deal.validFrom));
    matchingCoupons.sort((a, b) => Date.parse(b.coupon.validFrom) - Date.parse(a.coupon.validFrom));
  }

  const pageOffers = kind === 'deals' ? matchingDeals : matchingCoupons;
  return {
    kind,
    deals: kind === 'deals' ? matchingDeals : [],
    coupons: kind === 'coupons' ? matchingCoupons : [],
    total: pageOffers.length,
    search,
    sort
  };
}

function isCurrentlyValid(offer: Coupon | Deal, now: number): boolean {
  const validFrom = Date.parse(offer.validFrom);
  const validUntil = Date.parse(offer.validUntil);
  return offer.status === 'active' &&
    Number.isFinite(validFrom) &&
    Number.isFinite(validUntil) &&
    validFrom <= now &&
    validUntil >= now;
}

function matchesSearch(search: string, ...values: string[]): boolean {
  return !search || values.some(value => value.toLocaleLowerCase().includes(search));
}

function discountPercent(type: Deal['discountType'], value: number, price: number): number {
  return type === 'percentage' ? value : price > 0 ? value / price * 100 : 0;
}

function couponDiscountPercent(coupon: Coupon, price: number): number {
  const calculated = discountPercent(coupon.discountType, coupon.discountValue, price);
  const maximumPercent = coupon.maxDiscount > 0 ? coupon.maxDiscount / price * 100 : calculated;
  return price > 0 ? Math.min(calculated, maximumPercent) : 0;
}
