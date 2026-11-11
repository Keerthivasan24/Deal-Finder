import { Component, OnInit } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay, tap } from 'rxjs';
import { MockDataService } from '../services/mock-data.service';
import { buildCategoriesPage, CategoryPageItem } from './categories-page-data';

@Component({
  selector: 'app-categories-page',
  standalone: false,
  templateUrl: './categories-page.html',
  styleUrl: './categories-page.scss'
})
export class CategoriesPageComponent implements OnInit {
  categories$: Observable<CategoryPageItem[] | null> = of(null);
  loading = true;
  errorMessage = '';
  private readonly failedImages = new Set<string>();

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

  constructor(private readonly mockData: MockDataService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.errorMessage = '';
    this.categories$ = forkJoin([
      this.mockData.getCategories(),
      this.mockData.getProducts()
    ]).pipe(
      map(([categories, products]) => buildCategoriesPage(categories, products)),
      tap(() => {
        this.loading = false;
      }),
      catchError((error: unknown) => {
        console.error('Unable to load categories page data.', error);
        this.loading = false;
        this.errorMessage = 'We could not load categories. Please try again.';
        return of(null);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  iconFor(icon: string): string {
    return this.categoryIcons[icon] ?? '🏷️';
  }

  isImageUnavailable(categoryId: string): boolean {
    return this.failedImages.has(categoryId);
  }

  imageFailed(categoryId: string): void {
    this.failedImages.add(categoryId);
  }

  imageUrl(path: string): string {
    return `/${path.replace(/^\/+/, '')}`;
  }

  trackCategory(_index: number, item: CategoryPageItem): string {
    return item.category.id;
  }

  trackSubcategory(_index: number, item: CategoryPageItem['subcategories'][number]): string {
    return item.subcategory.id;
  }
}
