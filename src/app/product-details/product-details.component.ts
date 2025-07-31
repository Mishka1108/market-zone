import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnDestroy } from '@angular/core';
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
export class ProductDetailsComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  isLoading = true;
  error: string | null = null;
  currentImageIndex = 0;
  productImages: string[] = [];
  
  // Image modal properties
  showImageModal = false;
  currentModalIndex = 0;

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

  ngOnDestroy(): void {
    // Clean up any subscriptions or event listeners if needed
    this.closeImageModal();
  }

  // Keyboard event listener for modal navigation
  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (this.showImageModal) {
      switch (event.key) {
        case 'Escape':
          this.closeImageModal();
          break;
        case 'ArrowLeft':
          this.prevModalImage();
          break;
        case 'ArrowRight':
          this.nextModalImage();
          break;
      }
    }
  }

  // Touch event handling for mobile swipe
  @HostListener('document:touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (this.showImageModal) {
      this.touchStartX = event.touches[0].clientX;
    }
  }

  @HostListener('document:touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (this.showImageModal && this.touchStartX !== null) {
      const touchEndX = event.changedTouches[0].clientX;
      const diff = this.touchStartX - touchEndX;
      
      if (Math.abs(diff) > 50) { // Minimum swipe distance
        if (diff > 0) {
          this.nextModalImage();
        } else {
          this.prevModalImage();
        }
      }
      
      this.touchStartX = null;
    }
  }

  private touchStartX: number | null = null;

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
    
    // Update swiper if available
    this.updateSwiperSlide(index);
  }

  // Update swiper to specific slide
  private updateSwiperSlide(index: number): void {
    try {
      const swiperElement = document.querySelector('.main-swiper') as any;
      if (swiperElement && swiperElement.swiper) {
        swiperElement.swiper.slideTo(index);
      }
    } catch (error) {
      console.warn('Swiper update failed:', error);
    }
  }

  // შემდეგი სურათი
  nextImage(): void {
    if (this.currentImageIndex < this.productImages.length - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0;
    }
    this.updateSwiperSlide(this.currentImageIndex);
  }

  // წინა სურათი
  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.productImages.length - 1;
    }
    this.updateSwiperSlide(this.currentImageIndex);
  }

  // Image Modal Functions
  openImageModal(imageUrl: string, index: number): void {
    this.currentModalIndex = index;
    this.showImageModal = true;
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  closeImageModal(): void {
    this.showImageModal = false;
    
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  nextModalImage(): void {
    if (this.currentModalIndex < this.productImages.length - 1) {
      this.currentModalIndex++;
    }
  }

  prevModalImage(): void {
    if (this.currentModalIndex > 0) {
      this.currentModalIndex--;
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
      const body = encodeURIComponent(`გამარჯობა,

მაინტერესებს თქვენი პროდუქტი: ${this.product.title}
ფასი: ${this.formatPrice(this.product.price)}

გთხოვთ, დამიკავშირდით დეტალური ინფორმაციისთვის.

მადლობა!`);
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

  // Product sharing with enhanced options
  shareProduct(): void {
    const currentUrl = window.location.origin + this.router.url;
    const title = this.product?.title || 'პროდუქტი ';
    const text = `შეხედეთ ამ საინტერესო პროდუქტს: ${title}`;

    // Check if Web Share API is supported
    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: currentUrl
      }).then(() => {
        this.showSnackBar('პროდუქტი გაზიარდა');
      }).catch((error) => {
        console.log('Web Share API error:', error);
        this.fallbackShare(currentUrl);
      });
    } else {
      this.fallbackShare(currentUrl);
    }
  }

  private fallbackShare(url: string): void {
    // Copy to clipboard as fallback
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.showSnackBar('ლინკი კოპირებულია ბუფერში');
      }).catch(() => {
        this.openFacebookShare(url);
      });
    } else {
      this.openFacebookShare(url);
    }
  }

  private openFacebookShare(url: string): void {
    const encodedUrl = encodeURIComponent(url);
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    window.open(fbShareUrl, '_blank', 'width=600,height=400');
    this.showSnackBar('Facebook გაზიარების ფანჯარა გაიხსნა');
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
      verticalPosition: 'bottom',
      panelClass: ['custom-snackbar']
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
    if (!price) return '0₾';
    return price.toLocaleString('ka-GE') + '₾';
  }

  // თარიღის ფორმატირება
  formatDate(date: string): string {
    if (!date) return 'არ არის მითითებული';
    try {
      return new Date(date).toLocaleDateString('ka-GE');
    } catch {
      return 'არ არის მითითებული';
    }
  }

  // Error handling for images
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.dataset['errorHandled']) {
      target.src = 'assets/images/placeholder.jpg';
      target.dataset['errorHandled'] = 'true';
      console.error('სურათის ჩატვირთვის შეცდომა:', event);
    }
  }

  onThumbnailError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.dataset['errorHandled']) {
      img.src = 'assets/images/placeholder.jpg';
      img.dataset['errorHandled'] = 'true';
      console.error('თამბნილის სურათის შეცდომა:', event);
    }
  }

  // Check if image is valid URL
  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Lazy loading optimization
  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.classList.add('loaded');
    }
  }
}