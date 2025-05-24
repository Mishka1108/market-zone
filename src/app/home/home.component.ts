import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [MatButton, MatIcon, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  
  constructor(private router: Router) {}

  onCategoryClick(category: string): void {
    console.log(`კატეგორია დაჭერილია: ${category}`);
    // გადავიდეთ პროდუქტების გვერდზე არჩეული კატეგორიით
    this.router.navigate(['/public-products'], { 
      queryParams: { category: category } 
    });
  }
}