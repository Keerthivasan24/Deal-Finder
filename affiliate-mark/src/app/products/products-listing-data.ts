import {
  Category,
  Coupon,
  Deal,
  Product,
  ProductListingItem
} from '../models/mock-data.models';

export type ProductSort = 'featured' | 'price-asc' | 'price-desc' | 'rating';
export type ProductOfferFilter = 'all' | 'coupons' | 'deals';

export interface ProductListingFilters {
  search: string;
  categories: string[];
  subcategory: string | null;
  offer: ProductOfferFilter;
  minPrice: number | null;
  maxPrice: number | null;
  sort: ProductSort;
  page: number;
}

export interface ProductListingViewModel {
  categories: Category[];
  categoryCounts: Record<string, number>;
  products: ProductListingItem[];
  totalProducts: number;
  filters: ProductListingFilters;
  pageCount: number;
  pageSize: number;
}

const VALID_SORTS: ProductSort[] = ['featured', 'price-asc', 'price-desc', 'rating'];
const PAGE_SIZE = 12;

export function parseProductListingFilters(
  params: Record<string, string | null>,
  categories: Category[],
  products: Product[],
  pageSize = PAGE_SIZE
): ProductListingFilters {
  const allowedCategoryValues = new Set(
    categories.flatMap(category => [category.id, category.slug])
  );
  const rawCategory = params['category'] ?? '';
  const selectedCategories = rawCategory
    .split(',')
    .filter(value => allowedCategoryValues.has(value));
  const allowedSubcategories = categories.flatMap(category =>
    category.subcategories.map(subcategory => ({
      categoryId: category.id,
      id: subcategory.id,
      slug: subcategory.slug
    }))
  );
  const rawSubcategory = params['subcategory'] ?? '';
  const selectedSubcategory = allowedSubcategories.find(subcategory =>
    (subcategory.id === rawSubcategory || subcategory.slug === rawSubcategory) &&
    (!selectedCategories.length || selectedCategories.some(value => {
      const category = categories.find(item => item.id === value || item.slug === value);
      return category?.id === subcategory.categoryId;
    }))
  )?.id ?? null;
  const filterAlias = params['filter'] === 'coupons' ? 'coupons' : null;
  const offerParam = params['offer'] ?? filterAlias ?? 'all';
  const offer: ProductOfferFilter =
    offerParam === 'coupons' || offerParam === 'deals' ? offerParam : 'all';
  const rawSort = params['sort'];
  const sort = VALID_SORTS.includes(rawSort as ProductSort)
    ? rawSort as ProductSort
    : 'featured';
  const minPrice = parsePrice(params['min']);
  const maxPrice = parsePrice(params['max']);
  const normalizedMin = minPrice !== null && maxPrice !== null && minPrice > maxPrice
    ? maxPrice
    : minPrice;
  const normalizedMax = minPrice !== null && maxPrice !== null && minPrice > maxPrice
    ? minPrice
    : maxPrice;
  const pageCount = Math.max(1, Math.ceil(products.filter(product => product.isActive).length / pageSize));
  const requestedPage = Number.parseInt(params['page'] ?? '1', 10);

  return {
    search: (params['q'] ?? '').trim(),
    categories: selectedCategories,
    subcategory: selectedSubcategory,
    offer,
    minPrice: normalizedMin,
    maxPrice: normalizedMax,
    sort,
    page: Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), pageCount) : 1
  };
}

export function buildProductListing(
  categories: Category[],
  products: Product[],
  deals: Deal[],
  coupons: Coupon[],
  params: Record<string, string | null>,
  now = Date.now(),
  pageSize = PAGE_SIZE
): ProductListingViewModel {
  const filters = parseProductListingFilters(params, categories, products, pageSize);
  const validOffer = (offer: Coupon | Deal): boolean =>
    offer.status === 'active' &&
    Date.parse(offer.validFrom) <= now &&
    Date.parse(offer.validUntil) >= now;
  const categoryIds = new Set(
    filters.categories.flatMap(value => {
      const category = categories.find(item => item.id === value || item.slug === value);
      return category ? [category.id] : [];
    })
  );

  const productsWithOffers: ProductListingItem[] = products
    .filter(product => product.isActive)
    .map(product => ({
      product,
      hasCoupons: coupons.some(coupon =>
        coupon.productId === product.id &&
        product.couponIds.includes(coupon.id) &&
        validOffer(coupon)
      ),
      hasDeals: deals.some(deal =>
        deal.productId === product.id &&
        product.dealIds.includes(deal.id) &&
        validOffer(deal)
      )
    }));

  const search = filters.search.toLocaleLowerCase();
  const matchingProducts = productsWithOffers.filter(item => {
    const product = item.product;
    if (categoryIds.size && !categoryIds.has(product.categoryId)) return false;
    if (filters.subcategory && product.subcategoryId !== filters.subcategory) return false;
    if (filters.offer === 'coupons' && !item.hasCoupons) return false;
    if (filters.offer === 'deals' && !item.hasDeals) return false;
    if (filters.minPrice !== null && product.price < filters.minPrice) return false;
    if (filters.maxPrice !== null && product.price > filters.maxPrice) return false;
    return !search ||
      product.name.toLocaleLowerCase().includes(search) ||
      product.brand.toLocaleLowerCase().includes(search);
  });

  const sortedProducts = [...matchingProducts].sort((a, b) => {
    switch (filters.sort) {
      case 'price-asc':
        return a.product.price - b.product.price;
      case 'price-desc':
        return b.product.price - a.product.price;
      case 'rating':
        return b.product.rating - a.product.rating || b.product.reviewCount - a.product.reviewCount;
      default:
        return Number(b.product.isFeatured) - Number(a.product.isFeatured);
    }
  });
  const totalProducts = sortedProducts.length;
  const pageCount = Math.max(1, Math.ceil(totalProducts / pageSize));
  const page = Math.min(filters.page, pageCount);
  const start = (page - 1) * pageSize;
  const categoryCounts = Object.fromEntries(
    categories.map(category => [
      category.id,
      products.filter(product => product.isActive && product.categoryId === category.id).length
    ])
  );

  return {
    categories,
    categoryCounts,
    products: sortedProducts.slice(start, start + pageSize),
    totalProducts,
    filters: { ...filters, page },
    pageCount,
    pageSize
  };
}

function parsePrice(value: string | null): number | null {
  if (value == null || value.trim() === '') return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}
