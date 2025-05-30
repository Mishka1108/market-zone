import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit {
  product: Product | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  public currentUser: User | null = null; // მომხმარებლის ინფორმაცია, რომელიც სექრეტარად არის ავტორიზებული

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private authService: AuthService // თუ AuthService საჭიროა, დაამატეთ აქ
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user=> {
      this.currentUser = user; // მომხმარებლის ინფორმაცია
      console.log('მომხმარებელი:', this.currentUser); // კონსოლში გამოვიტანოთ მომხმარებლის ინფორმაცია
    }) // მომხმარებლის ინფორმაცია
    console.log('მომხმარებლის ინფორმაცია:', this.currentUser);
    this.route.paramMap.subscribe(params => {
      const productId = params.get('id');
      if (productId) {
        console.log('პროდუქტის ID მიღებულია:', productId);
        this.loadProductDetails(productId);
      } else {
        this.error = 'პროდუქტის ID არ არის მითითებული';
        this.isLoading = false;
      }
    });
  }
  
  // პროდუქტის დეტალების ჩატვირთვა
  loadProductDetails(productId: string): void {
    this.isLoading = true;
    this.productService.getProductById(productId).subscribe({
      next: (response) => {
        console.log('სერვისის პასუხი:', response);
        
        // განვსაზღვროთ პროდუქტის ობიექტი
        if (response.product) {
          this.product = response.product;
        } else if (response) {
          // თუ პასუხი არის პირდაპირ პროდუქტის ობიექტი
          this.product = response;
        } else {
          this.error = 'პროდუქტის მონაცემები ვერ მოიძებნა';
        }
        
        // შევავსოთ ცარიელი საკონტაქტო ინფორმაცია მნიშვნელობით 'არ არის მითითებული'
        if (this.product) {
          if (!this.product.userName || this.product.userName.trim() === '') {
            this.product.userName = 'არ არის მითითებული';
          }
          
          if (!this.product.userEmail || this.product.userEmail.trim() === '') {
            this.product.userEmail = 'არ არის მითითებული';
          }
          
          if (!this.product.userPhone || this.product.userPhone.trim() === '') {
            this.product.userPhone = 'არ არის მითითებული';
          }
          
          // კონსოლში გამოვიტანოთ ინფორმაცია დებაგისთვის
          console.log('პროდუქტის საკონტაქტო ინფორმაცია:', {
            userName: this.product.userName,
            userEmail: this.product.userEmail,
            userPhone: this.product.userPhone
          });
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('პროდუქტის დეტალების ჩატვირთვის შეცდომა:', error);
        this.error = 'პროდუქტის დეტალების ჩატვირთვა ვერ მოხერხდა';
        this.isLoading = false;
        this.showSnackBar('პროდუქტის დეტალების ჩატვირთვა ვერ მოხერხდა');
      }
    });
  }

  // უკან დაბრუნება
  goBack(): void {
    this.router.navigate(['/public-products']);
  }

  // შეტყობინება
  showSnackBar(message: string): void {
    this.snackBar.open(message, 'დახურვა', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}