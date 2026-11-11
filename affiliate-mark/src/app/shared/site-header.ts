import { Component } from '@angular/core';

@Component({
  selector: 'app-site-header',
  standalone: false,
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss'
})
export class SiteHeaderComponent {
  mobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}
