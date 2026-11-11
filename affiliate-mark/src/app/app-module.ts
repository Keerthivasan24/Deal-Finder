import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { HomePageComponent } from './home/home-page';
import { SiteHeaderComponent } from './shared/site-header';
import { ProductsListingComponent } from './products/products-listing';
import { ProductDetailsComponent } from './products/product-details';
import { OffersPageComponent } from './offers/offers-page';
import { CategoriesPageComponent } from './categories/categories-page';
import { SiteFooterComponent } from './shared/site-footer';

@NgModule({
  declarations: [
    App,
    HomePageComponent,
    SiteHeaderComponent,
    ProductsListingComponent,
    ProductDetailsComponent,
    OffersPageComponent,
    CategoriesPageComponent,
    SiteFooterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient()
  ],
  bootstrap: [App]
})
export class AppModule { }
