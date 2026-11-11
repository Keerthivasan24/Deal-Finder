import { Component } from '@angular/core';

@Component({
  selector: 'app-site-footer',
  standalone: false,
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss'
})
export class SiteFooterComponent {
  readonly currentYear = new Date().getFullYear();
}
