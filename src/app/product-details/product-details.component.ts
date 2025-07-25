import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product';

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
    MatChipsModule
  ],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProductDetailsComponent implements OnInit {
  product: Product | null = null;
  isLoading = true;
  error: string | null = null;
  currentImageIndex = 0;
  productImages: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private location: Location,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    
    console.log('ProductDetailsComponent ინიცირებულია, პროდუქტის ID:', productId);
    
    if (!productId) {
      this.error = 'პროდუქტის ID არ არის მითითებული';
      this.isLoading = false;
      return;
    }

    this.loadProduct(productId);
  }

  // პროდუქტის ყველა სურათის მიღება
  getAllProductImages(product: Product): string[] {
    const images: string[] = [];
    
    // პირველ რიგში ვამატებთ ძირითად სურათს
    if (product.image) {
      images.push(product.image);
    }
    
    // შემდეგ ვამატებთ სურათების მასივიდან, მხოლოდ იმ სურათებს რომლებიც არ მეორდება
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(image => {
        if (image && !images.includes(image)) {
          images.push(image);
        }
      });
    }
    
    // ძველი ველების მხარდაჭერა (უკანასკნელი თავსებადობისთვის)
    [product.productImage1, product.productImage2, product.productImage3].forEach(image => {
      if (image && !images.includes(image)) {
        images.push(image);
      }
    });
    
    console.log(`პროდუქტის ${product.title} სურათები:`, images);
    
    // თუ არ არის სურათები, placeholder დავაბრუნოთ
    if (images.length === 0) {
      images.push('assets/images/placeholder.jpg');
    }
    
    return images;
  }

  // სურათის ინდექსის შეცვლა
  changeImage(index: number): void {
    this.currentImageIndex = index;
  }

  // შემდეგი სურათი
  nextImage(): void {
    if (this.currentImageIndex < this.productImages.length - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0;
    }
  }

  // წინა სურათი
  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.productImages.length - 1;
    }
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
        console.log('მივიღეთ პასუხი ProductDetailsComponent-ში:', response);
        
        // განვსაზღვროთ პროდუქტი
        this.product = response.product || response;
        
        // სურათების მიღება
        if (this.product) {
          this.productImages = this.getAllProductImages(this.product);
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

  // დამხმარე მეთოდები Template-ისთვის
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

  // ფასის ფორმატირება
  formatPrice(price: number): string {
    return price.toLocaleString('ka-GE') + '₾';
  }

  // თარიღის ფორმატირება
  formatDate(date: string): string {
    if (!date) return 'არ არის მითითებული';
    return new Date(date).toLocaleDateString('ka-GE');
  }
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/placeholder.jpg'; // შეცვალეთ placeholder-ის მისამართი საჭიროების მიხედვით
    console.error('სურათის ჩატვირთვის შეცდომა:', event);
  }
  onThumbnailError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/placeholder.jpg'; // შეცვალეთ placeholder-ის მისამართი საჭიროების მიხედვით
    }
    console.error('თამბნილის სურათის შეცდომა:', event);
  }
 shareProduct(): void {
  const currentUrl = window.location.origin + this.router.url;
  const encodedUrl = encodeURIComponent(currentUrl);
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  window.open(fbShareUrl, '_blank', 'width=600,height=400');
  console.log("Share URL:", currentUrl);
}
}