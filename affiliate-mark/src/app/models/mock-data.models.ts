export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

export interface Affiliate {
  platform: string;
  url: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  categoryId: string;
  subcategoryId: string;
  image: string;
  gallery: string[];
  price: number;
  originalPrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  affiliate: Affiliate;
  couponIds: string[];
  dealIds: string[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
}

export type DiscountType = 'percentage' | 'fixed';
export type OfferStatus = 'active' | 'expired' | 'upcoming';

export interface Coupon {
  id: string;
  productId: string;
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number;
  minimumPurchase: number;
  validFrom: string;
  validUntil: string;
  terms: string;
  status: OfferStatus;
}

export type DealType = 'price_discount' | 'limited_time_offer' | 'special_offer';

export interface Deal {
  id: string;
  productId: string;
  title: string;
  dealType: DealType;
  discountType: DiscountType;
  discountValue: number;
  description: string;
  validFrom: string;
  validUntil: string;
  status: OfferStatus;
}

export interface ProductDeal {
  deal: Deal;
  product: Product;
}

export interface ProductCoupon {
  coupon: Coupon;
  product: Product;
}

export interface HomePageData {
  categories: Category[];
  trendingProducts: Product[];
  activeDeals: ProductDeal[];
  activeCoupons: ProductCoupon[];
}

export interface ProductListingItem {
  product: Product;
  hasCoupons: boolean;
  hasDeals: boolean;
}

export interface ProductDetailsData {
  product: Product;
  category: Category;
  subcategory: Subcategory | null;
  coupons: Coupon[];
  deals: Deal[];
  relatedProducts: Product[];
}
