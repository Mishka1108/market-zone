import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
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
  ],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private location: Location,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    
    console.log('ProductDetailComponent ინიცირებულია, პროდუქტის ID:', productId);
    
    if (!productId) {
      this.error = 'პროდუქტის ID არ არის მითითებული';
      this.isLoading = false;
      return;
    }

    this.loadProduct(productId);
  }

  // იმეილის გაგზავნა
  sendEmail(): void {
    if (!this.product?.email || this.product.email === 'არ არის მითითებული') {
      this.showSnackBar('იმეილის მისამართი არ არის ხელმისაწვდომი');
      return;
    }

    try {
      const subject = encodeURIComponent(`${this.product.title} - პროდუქტთან დაკავშირებით`);
      const body = encodeURIComponent(`გამარჯობა,\n\nმაინტერესებს თქვენი პროდუქტი: ${this.product.title}\nფასი: ${this.product.price}₾\n\nმადლობა!`);
      const mailtoLink = `mailto:${this.product.email}?subject=${subject}&body=${body}`;
      
      window.open(mailtoLink, '_blank');
      this.showSnackBar('იმეილის კლიენტი გაიხსნა');
    } catch (error) {
      console.error('იმეილის გაგზავნის შეცდომა:', error);
      this.showSnackBar('იმეილის გაგზავნისას წარმოიშვა შეცდომა');
    }
  }

  // ტელეფონზე დარეკვა
  callPhone(): void {
    if (!this.product?.phone || this.product.phone === 'არ არის მითითებული') {
      this.showSnackBar('ტელეფონის ნომერი არ არის ხელმისაწვდომი');
      return;
    }

    try {
      // ტელეფონის ნომრის გაწმენდა (მხოლოდ ციფრები და + ნიშანი)
      const cleanPhone = this.product.phone.replace(/[^\d+]/g, '');
      
      // tel: პროტოკოლის გამოყენება
      const telLink = `tel:${cleanPhone}`;
      
      // ნავიგაციის შექმნა
      window.location.href = telLink;
      
      this.showSnackBar('ტელეფონის აპლიკაცია გაიხსნა');
    } catch (error) {
      console.error('დარეკვის შეცდომა:', error);
      this.showSnackBar('დარეკვისას წარმოიშვა შეცდომა');
    }
  }

  loadProduct(productId: string): void {
    console.log('ვიწყებთ პროდუქტის ჩატვირთვას ID-ით:', productId);
    
    this.productService.getProductById(productId).subscribe({
      next: (response) => {
        console.log('მივიღეთ პასუხი ProductDetailComponent-ში:', response);
        
        // განვსაზღვროთ პროდუქტი
        this.product = response.product || response;
        
        console.log('დაყენებული პროდუქტი კომპონენტში:', this.product);
        
        if (this.product) {
          console.log('კონტაქტის ინფორმაცია კომპონენტში:', {
            email: this.product.email,
            phone: this.product.phone,
            userName: this.product.userName
          });
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('პროდუქტის ჩატვირთვის შეცდომა:', err);
        this.error = 'პროდუქტის ჩატვირთვა ვერ მოხერხდა. გთხოვთ, სცადოთ ხელახლა.';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'დახურვა', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  // დამხმარე მეთოდები Template-ისთვის (თუ მაინც გჭირდებათ)
  getSellerName(): string {
    if (!this.product) return 'არ არის მითითებული';
    return this.product.userName || 'არ არის მითითებული';
  }

  getSellerEmail(): string {
    if (!this.product) return 'არ არის მითითებული';
    return this.product.email || 'არ არის მითითებული';
  }

  getSellerPhone(): string {
    if (!this.product) return 'არ არის მითითებული';
    return this.product.phone || 'არ არის მითითებული';
  }
}