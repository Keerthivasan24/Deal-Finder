import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home/home-page';
import { ProductsListingComponent } from './products/products-listing';
import { ProductDetailsComponent } from './products/product-details';
import { OffersPageComponent } from './offers/offers-page';
import { CategoriesPageComponent } from './categories/categories-page';

const routes: Routes = [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  { path: 'products', component: ProductsListingComponent },
  { path: 'products/:id', component: ProductDetailsComponent },
  { path: 'deals', component: OffersPageComponent, data: { kind: 'deals' } },
  { path: 'coupons', component: OffersPageComponent, data: { kind: 'coupons' } },
  { path: 'categories', component: CategoriesPageComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
