import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, combineLatest, map, of, shareReplay, tap } from 'rxjs';
import {
  Coupon,
  Deal,
  DiscountType,
  Product,
  ProductDetailsData
} from '../models/mock-data.models';
import { MockDataService } from '../services/mock-data.service';
import { buildProductDetailsData } from './product-details-data';

interface ProductDetailsState {
  data: ProductDetailsData | null;
  notFound: boolean;
}

@Component({
  selector: 'app-product-details',
  standalone: false,
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss'
})
export class ProductDetailsComponent implements OnInit {
  details$: Observable<ProductDetailsState> = of({ data: null, notFound: false });
  loading = true;
  errorMessage = '';
  selectedImage = '';
  private readonly failedImages = new Set<string>();

  constructor(
    private readonly mockData: MockDataService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadProduct();
  }

  loadProduct(): void {
    this.loading = true;
    this.errorMessage = '';
    this.details$ = combineLatest([
      this.route.paramMap,
      this.mockData.getHomePageData()
    ]).pipe(
      map(([params, [categories, products, deals, coupons]]) => {
        const data = buildProductDetailsData(
          params.get('id') ?? '',
          categories,
          products,
          deals,
          coupons
        );
        if (data) this.selectedImage = data.product.image;
        return { data, notFound: !data };
      }),
      tap(() => {
        this.loading = false;
      }),
      catchError((error: unknown) => {
        console.error('Unable to load product details.', error);
        this.loading = false;
        this.errorMessage = 'We could not load this product. Please try again.';
        return of({ data: null, notFound: false });
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  selectImage(path: string): void {
    this.selectedImage = path;
  }

  isImageUnavailable(path: string): boolean {
    return this.failedImages.has(path);
  }

  imageFailed(path: string): void {
    this.failedImages.add(path);
  }

  productImages(product: Product): string[] {
    return [...new Set([product.image, ...product.gallery].filter(Boolean))];
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

  imageUrl(path: string): string {
    return `/${path.replace(/^\/+/, '')}`;
  }

  discountPercentage(product: Product): number {
    return product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;
  }

  formatDiscount(type: DiscountType, value: number): string {
    return type === 'percentage' ? `${value}% off` : `${this.formatPrice(value)} off`;
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  }

  trackImage(_index: number, image: string): string {
    return image;
  }

  trackCoupon(_index: number, coupon: Coupon): string {
    return coupon.id;
  }

  trackDeal(_index: number, deal: Deal): string {
    return deal.id;
  }

  trackProduct(_index: number, product: Product): string {
    return product.id;
  }
}
