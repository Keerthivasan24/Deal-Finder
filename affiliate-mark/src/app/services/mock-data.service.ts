import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { Category, Coupon, Deal, Product } from '../models/mock-data.models';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  constructor(private readonly http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/data/categories.json');
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/data/products.json');
  }

  getCoupons(): Observable<Coupon[]> {
    return this.http.get<Coupon[]>('/data/coupons.json');
  }

  getDeals(): Observable<Deal[]> {
    return this.http.get<Deal[]>('/data/deals.json');
  }

  getHomePageData(): Observable<[Category[], Product[], Deal[], Coupon[]]> {
    return forkJoin([
      this.getCategories(),
      this.getProducts(),
      this.getDeals(),
      this.getCoupons()
    ]);
  }
}
