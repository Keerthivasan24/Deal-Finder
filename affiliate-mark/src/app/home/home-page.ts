import { Component, OnInit } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap } from 'rxjs';
import {
  Category,
  Coupon,
  Deal,
  DealType,
  HomePageData,
  Product
} from '../models/mock-data.models';
import { MockDataService } from '../services/mock-data.service';
import { buildHomePageData } from './home-page-data';

@Component({
  selector: 'app-home-page',
  standalone: false,
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePageComponent implements OnInit {
  homeData$: Observable<HomePageData | null> = of(null);
  loading = true;
  errorMessage = '';
  private readonly failedCategoryImages = new Set<string>();
  private readonly failedProductImages = new Set<string>();
  private readonly categoryIcons: Record<string, string> = {
    'monitor-smartphone': '📱',
    armchair: '🪑',
    shirt: '👕',
    'cooking-pot': '🍳',
    sparkles: '✨',
    dumbbell: '🏋️',
    'book-open': '📚',
    car: '🚗'
  };
  private readonly categoryVisuals: Record<string, string> = {
    'category-electronics': '📱',
    'category-furniture': '🛋️',
    'category-fashion': '👟',
    'category-home-kitchen': '🍳',
    'category-beauty-personal-care': '✨',
    'category-sports-fitness': '🏃',
    'category-books-education': '📖',
    'category-automotive': '🚘'
  };

  constructor(private readonly mockData: MockDataService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.homeData$ = this.mockData.getHomePageData().pipe(
      map(([categories, products, deals, coupons]) =>
        this.toHomePageData(categories, products, deals, coupons)
      ),
      tap(() => {
        this.loading = false;
      }),
      catchError((error: unknown) => {
        console.error('Unable to load home page data.', error);
        this.loading = false;
        this.errorMessage = 'We could not load the latest picks. Please try again.';
        return of(null);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  categoryIcon(icon: string): string {
    return this.categoryIcons[icon] ?? '🏷️';
  }

  categoryVisual(categoryId: string): string {
    return this.categoryVisuals[categoryId] ?? '🛍️';
  }

  productVisual(categoryId: string): string {
    return this.categoryVisuals[categoryId] ?? '🛍️';
  }

  categoryImageUnavailable(categoryId: string): boolean {
    return this.failedCategoryImages.has(categoryId);
  }

  productImageUnavailable(productId: string): boolean {
    return this.failedProductImages.has(productId);
  }

  categoryImageFailed(categoryId: string): void {
    this.failedCategoryImages.add(categoryId);
  }

  productImageFailed(productId: string): void {
    this.failedProductImages.add(productId);
  }

  imageUrl(path: string): string {
    return `/${path.replace(/^\/+/, '')}`;
  }

  formatDiscount(type: string, value: number): string {
    return type === 'percentage' ? `${value}% off` : `${this.formatPrice(value)} off`;
  }

  formatDealType(type: DealType): string {
    return type.replaceAll('_', ' ');
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  private toHomePageData(
    categories: Category[],
    products: Product[],
    deals: Deal[],
    coupons: Coupon[]
  ): HomePageData {
    return buildHomePageData(categories, products, deals, coupons);
  }
}
