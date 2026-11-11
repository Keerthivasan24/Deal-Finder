import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, combineLatest, map, of, shareReplay, tap } from 'rxjs';
import { Coupon, Deal, Product } from '../models/mock-data.models';
import { MockDataService } from '../services/mock-data.service';
import {
  buildOffersPage,
  OffersPageKind,
  OffersPageViewModel,
  OffersSort
} from './offers-page-data';

@Component({
  selector: 'app-offers-page',
  standalone: false,
  templateUrl: './offers-page.html',
  styleUrl: './offers-page.scss'
})
export class OffersPageComponent implements OnInit {
  offers$: Observable<OffersPageViewModel | null> = of(null);
  kind: OffersPageKind = 'deals';
  loading = true;
  errorMessage = '';
  copyFeedback: Record<string, string> = {};
  private readonly failedImages = new Set<string>();

  constructor(
    private readonly mockData: MockDataService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.offers$ = combineLatest([
      this.route.data,
      this.route.queryParamMap,
      this.mockData.getHomePageData()
    ]).pipe(
      map(([routeData, params, [, products, deals, coupons]]) => {
        this.kind = routeData['kind'] === 'coupons' ? 'coupons' : 'deals';
        const query = Object.fromEntries(
          ['q', 'sort'].map(key => [key, params.get(key)])
        );
        return buildOffersPage(this.kind, products, deals, coupons, query);
      }),
      tap(() => {
        this.loading = false;
      }),
      catchError((error: unknown) => {
        console.error(`Unable to load ${this.kind} data.`, error);
        this.loading = false;
        this.errorMessage = `We could not load ${this.kind}. Please try again.`;
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
    const sort = (event.target as HTMLSelectElement).value as OffersSort;
    this.updateQuery({ sort: sort === 'featured' ? null : sort });
  }

  async copyCode(coupon: Coupon): Promise<void> {
    let timeoutId: number | undefined;
    try {
      const clipboard = navigator.clipboard;
      if (!clipboard?.writeText) {
        throw new Error('Clipboard access is unavailable in this browser context.');
      }
      await Promise.race([
        clipboard.writeText(coupon.code),
        new Promise<never>((_resolve, reject) => {
          timeoutId = window.setTimeout(
            () => reject(new Error('Clipboard access did not complete.')),
            3000
          );
        })
      ]);
      this.copyFeedback = { ...this.copyFeedback, [coupon.id]: 'Code copied!' };
    } catch (error) {
      console.error(`Unable to copy coupon ${coupon.id}.`, error);
      this.copyFeedback = {
        ...this.copyFeedback,
        [coupon.id]: 'Could not copy. Select and copy the code manually.'
      };
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
  }

  isImageUnavailable(productId: string): boolean {
    return this.failedImages.has(productId);
  }

  imageFailed(productId: string): void {
    this.failedImages.add(productId);
  }

  imageUrl(path: string): string {
    return `/${path.replace(/^\/+/, '')}`;
  }

  productVisual(product: Product): string {
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
    return visuals[product.categoryId] ?? '🛍️';
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDiscount(type: Deal['discountType'] | Coupon['discountType'], value: number): string {
    return type === 'percentage' ? `${value}% off` : `${this.formatPrice(value)} off`;
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }

  trackDeal(_index: number, item: { deal: Deal }): string {
    return item.deal.id;
  }

  trackCoupon(_index: number, item: { coupon: Coupon }): string {
    return item.coupon.id;
  }

  private updateQuery(queryParams: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
