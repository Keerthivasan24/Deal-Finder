import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, combineLatest, map, of, shareReplay, tap } from 'rxjs';
import { Category, ProductListingItem } from '../models/mock-data.models';
import { MockDataService } from '../services/mock-data.service';
import {
  buildProductListing,
  ProductListingFilters,
  ProductListingViewModel
} from './products-listing-data';

@Component({
  selector: 'app-products-listing',
  standalone: false,
  templateUrl: './products-listing.html',
  styleUrl: './products-listing.scss'
})
export class ProductsListingComponent implements OnInit {
  listing$: Observable<ProductListingViewModel | null> = of(null);
  loading = true;
  mobileFiltersOpen = false;
  errorMessage = '';
  private readonly failedImages = new Set<string>();

  constructor(
    private readonly mockData: MockDataService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';
    this.listing$ = combineLatest([
      this.mockData.getHomePageData(),
      this.route.queryParamMap
    ]).pipe(
      map(([[categories, products, deals, coupons], params]) => {
        const query = Object.fromEntries(
          ['q', 'category', 'subcategory', 'offer', 'filter', 'min', 'max', 'sort', 'page']
            .map(key => [key, params.get(key)])
        );
        return buildProductListing(categories, products, deals, coupons, query);
      }),
      tap(() => {
        this.loading = false;
      }),
      catchError((error: unknown) => {
        console.error('Unable to load product listing data.', error);
        this.loading = false;
        this.errorMessage = 'We could not load products. Please try again.';
        return of(null);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  updateSearch(event: Event): void {
    const search = (event.target as HTMLInputElement).value;
    this.updateQuery({ q: search || null });
  }

  updateSort(event: Event): void {
    const sort = (event.target as HTMLSelectElement).value;
    this.updateQuery({ sort: sort === 'featured' ? null : sort });
  }

  updateOffer(event: Event): void {
    const offer = (event.target as HTMLSelectElement).value;
    this.updateQuery({ offer: offer === 'all' ? null : offer, filter: null });
  }

  updatePrice(event: Event, field: 'min' | 'max'): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    this.updateQuery({ [field]: value === '' ? null : value });
  }

  toggleCategory(category: Category, event: Event, current: ProductListingFilters): void {
    const checked = (event.target as HTMLInputElement).checked;
    const categories = new Set(current.categories);
    if (checked) categories.add(category.id);
    else categories.delete(category.id);
    this.updateQuery({
      category: categories.size ? [...categories].join(',') : null,
      subcategory: null
    });
  }

  subcategoriesFor(listing: ProductListingViewModel): Array<{ id: string; name: string }> {
    const categories = listing.filters.categories.length
      ? listing.categories.filter(category =>
        listing.filters.categories.includes(category.id) ||
        listing.filters.categories.includes(category.slug)
      )
      : [];
    return categories.flatMap(category => category.subcategories);
  }

  updateSubcategory(event: Event): void {
    const subcategory = (event.target as HTMLSelectElement).value;
    this.updateQuery({ subcategory: subcategory || null });
  }

  clearFilters(): void {
    this.mobileFiltersOpen = false;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: null,
        category: null,
        subcategory: null,
        offer: null,
        filter: null,
        min: null,
        max: null,
        sort: null,
        page: null
      },
      queryParamsHandling: 'merge'
    });
  }

  changePage(page: number): void {
    this.updateQuery({ page: page === 1 ? null : page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleMobileFilters(): void {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  }

  isCategorySelected(category: Category, filters: ProductListingFilters): boolean {
    return filters.categories.includes(category.id) || filters.categories.includes(category.slug);
  }

  isImageUnavailable(productId: string): boolean {
    return this.failedImages.has(productId);
  }

  imageFailed(productId: string): void {
    this.failedImages.add(productId);
  }

  productVisual(item: ProductListingItem): string {
    const visuals: Record<string, string> = {
      'category-electronics': '📱',
      'category-furniture': '🛋️',
      'category-fashion': '👟',
      'category-home-kitchen': '🍳',
      'category-beauty-personal-care': '✨',
      'category-sports-fitness': '🏃',
      'category-books-education': '📖',
      'category-automotive': '🚘'
    };
    return visuals[item.product.categoryId] ?? '🛍️';
  }

  imageUrl(path: string): string {
    return `/${path.replace(/^\/+/, '')}`;
  }

  discountPercentage(item: ProductListingItem): number {
    const { price, originalPrice } = item.product;
    return originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
  }

  trackProduct(_index: number, item: ProductListingItem): string {
    return item.product.id;
  }

  pageNumbers(count: number): number[] {
    return Array.from({ length: count }, (_value, index) => index + 1);
  }

  private updateQuery(queryParams: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...queryParams, page: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
