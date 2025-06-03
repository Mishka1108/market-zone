import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router,} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';
import { User } from '../models/user.model';
import { Product } from '../models/product';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    MatAutocompleteModule, 
    MatButtonModule, 
    ReactiveFormsModule, 
    MatSelectModule, 
    HttpClientModule, 
    FormsModule, 
    MatInputModule, 
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  @ViewChild('profileInput', { static: false }) profileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('productInput', { static: false }) productInputRef!: ElementRef<HTMLInputElement>;

  currentUser: User | null = null;
  productFormVisible: boolean = false;
  isUploading: boolean = false;
  userProducts: Product[] = [];
  
  readonly MAX_PRODUCTS_ALLOWED: number = 5;
  
  productForm = new FormGroup({
    title: new FormControl<string>('', [Validators.required]),
    category: new FormControl<string>('', [Validators.required]),
    year: new FormControl<number | null>(null, [Validators.required, Validators.min(2000), Validators.max(new Date().getFullYear())]),
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    description: new FormControl<string>('', [Validators.required]),
    location: new FormControl<string>('', [Validators.required]),
    phone: new FormControl<string>('', [Validators.required, Validators.pattern(/^\+?\d{9,15}$/)]),
    email: new FormControl<string>('', [Validators.required, Validators.email]),
  });
  
  productImage: File | null = null;
  productImagePreview: string | null = null;
  
  categoryControl = new FormControl('');
  categories: string[] = [
     'ტელეფონები',
     'ტექნიკა',
     'ავტომობილები',
     'ტანსაცმელი',
     'სათამაშოები',
     'კომპიუტერები',
  ];
  filteredCategories!: string[];

  // ანდროიდ Chrome detection
  private isAndroidChrome = false;

  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private router: Router,
    private snackBar: MatSnackBar,
    private ngZone: NgZone
  ) {
    this.detectAndroidChrome();
  }
  
  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!this.currentUser) {
        this.router.navigate(['/auth/login']);
      }
    });
  
    this.authService.refreshUserData().subscribe();
    this.loadUserProducts();
    
    this.categoryControl.valueChanges
    .pipe(
      startWith(''),
      map((value: string | null) => (value ? this._filterCategories(value) : this.categories.slice()))
    )
    .subscribe((filtered: string[]) => {
      this.filteredCategories = filtered;
    });
  }

  private detectAndroidChrome(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    this.isAndroidChrome = userAgent.includes('android') && userAgent.includes('chrome');
    console.log('Android Chrome detected:', this.isAndroidChrome);
  }
  
  private _filterCategories(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.categories.filter(category =>
      category.toLowerCase().includes(filterValue)
    );
  }
  
  loadUserProducts(): void {
    this.productService.getUserProducts().subscribe({
      next: (response) => {
        this.userProducts = response.products;
      },
      error: (error) => {
        console.error('პროდუქტების ჩატვირთვის შეცდომა:', error);
        this.showSnackBar('პროდუქტების ჩატვირთვა ვერ მოხერხდა');
      }
    });
  }
  
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'არ არის მითითებული';
    return new Date(date).toLocaleDateString('ka-GE');
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // გამოსწორებული პროფილის ფაილის არჩევა
  triggerFileInput(): void {
    this.ngZone.run(() => {
      try {
        const fileInput = document.getElementById('profileImageInput') as HTMLInputElement;
        
        if (!fileInput) {
          console.error('Profile image input not found');
          this.showSnackBar('ფაილის არჩევის ველი ვერ მოიძებნა');
          return;
        }

        console.log('Triggering profile file input, Android Chrome:', this.isAndroidChrome);

        // ანდროიდ Chrome-ისთვის განსაკუთრებული მიდგომა
        if (this.isAndroidChrome) {
          this.handleAndroidChromeFileInput(fileInput, 'profile');
        } else {
          // სტანდარტული მიდგომა სხვა ბრაუზერებისთვის
          this.handleStandardFileInput(fileInput);
        }

      } catch (error) {
        console.error('Error triggering profile file input:', error);
        this.showSnackBar('ფაილის არჩევისას დაფიქსირდა შეცდომა');
      }
    });
  }

  // პროდუქტის სურათის არჩევა
  triggerProductImageInput(): void {
    this.ngZone.run(() => {
      try {
        const fileInput = document.getElementById('productImageInput') as HTMLInputElement;
        
        if (!fileInput) {
          console.error('Product image input not found');
          this.showSnackBar('ფაილის არჩევის ველი ვერ მოიძებნა');
          return;
        }

        console.log('Triggering product file input, Android Chrome:', this.isAndroidChrome);

        // ანდროიდ Chrome-ისთვის განსაკუთრებული მიდგომა
        if (this.isAndroidChrome) {
          this.handleAndroidChromeFileInput(fileInput, 'product');
        } else {
          // სტანდარტული მიდგომა სხვა ბრაუზერებისთვის
          this.handleStandardFileInput(fileInput);
        }

      } catch (error) {
        console.error('Error triggering product file input:', error);
        this.showSnackBar('ფაილის არჩევისას დაფიქსირდა შეცდომა');
      }
    });
  }

  // ანდროიდ Chrome-ისთვის სპეციალური მიდგომა
  private handleAndroidChromeFileInput(fileInput: HTMLInputElement, type: 'profile' | 'product'): void {
    console.log('Handling Android Chrome file input for:', type);
    
    // Input-ის სრული რესეტი
    fileInput.value = '';
    fileInput.removeAttribute('value');
    
    // Touch event simulation for better Android compatibility
    const touchEvents = ['touchstart', 'touchend', 'click'];
    
    // Multiple attempt strategy
    let attemptCount = 0;
    const maxAttempts = 3;
    
    const attemptClick = () => {
      attemptCount++;
      console.log(`Attempt ${attemptCount} to trigger file input`);
      
      try {
        // Create and dispatch touch events
        touchEvents.forEach(eventType => {
          const event = new TouchEvent(eventType, {
            bubbles: true,
            cancelable: true,
            touches: [],
            targetTouches: [],
            changedTouches: []
          });
          fileInput.dispatchEvent(event);
        });
        
        // Force focus and click
        fileInput.focus();
        
        // Multiple click attempts with different timings
        setTimeout(() => {
          fileInput.click();
        }, 10);
        
        setTimeout(() => {
          if (attemptCount < maxAttempts && (!fileInput.files || fileInput.files.length === 0)) {
            attemptClick();
          }
        }, 100);
        
      } catch (error) {
        console.error(`Error in attempt ${attemptCount}:`, error);
        if (attemptCount < maxAttempts) {
          setTimeout(attemptClick, 200);
        }
      }
    };
    
    // Start the attempt sequence
    requestAnimationFrame(() => {
      attemptClick();
    });
  }

  // სტანდარტული ბრაუზერებისთვის
  private handleStandardFileInput(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    
    requestAnimationFrame(() => {
      fileInput.click();
    });
  }

  // ფაილის არჩევის event handler
  onFileSelected(event: Event, type: 'profile' | 'product'): void {
    this.ngZone.run(() => {
      try {
        const input = event.target as HTMLInputElement;
        
        console.log('File selection event triggered for:', type);
        console.log('Input element:', input);
        console.log('Files found:', input?.files?.length || 0);
        
        // ანდროიდ Chrome-ში delayed response-ის მოწმება
        if (!input || !input.files || input.files.length === 0) {
          console.warn('No file selected immediately, checking for delayed selection...');
          
          // Multiple delayed checks for Android Chrome
          const checkDelayedSelection = (attempt: number = 1) => {
            setTimeout(() => {
              console.log(`Delayed check attempt ${attempt}`);
              if (input?.files && input.files.length > 0) {
                console.log('Delayed file detection successful:', input.files[0].name);
                this.processSelectedFile(input.files[0], type);
              } else if (attempt < 5) {
                checkDelayedSelection(attempt + 1);
              } else {
                console.warn('No file detected after multiple attempts');
              }
            }, attempt * 100);
          };
          
          checkDelayedSelection();
          return;
        }
        
        // Immediate file processing
        const file = input.files[0];
        console.log('File selected immediately:', file.name);
        this.processSelectedFile(file, type);
        
      } catch (error) {
        console.error('Error in file selection handler:', error);
        this.showSnackBar('სურათის არჩევისას დაფიქსირდა შეცდომა');
      }
    });
  }

  // Alternative file selection for Android Chrome (using label)
  onAlternativeFileSelected(event: Event, type: 'profile' | 'product'): void {
    console.log('Alternative file selection triggered for:', type);
    this.onFileSelected(event, type);
  }

  // ფაილის დამუშავება
  private processSelectedFile(file: File, type: 'profile' | 'product'): void {
    console.log('Processing selected file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    
    // ფაილის ტიპის შემოწმება
    if (!file.type.startsWith('image/')) {
      this.showSnackBar('გთხოვთ აირჩიოთ მხოლოდ სურათი');
      return;
    }
    
    // ფაილის ზომის შემოწმება (5MB მაქსიმუმ)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showSnackBar('სურათის ზომა არ უნდა აღემატებოდეს 5MB-ს');
      return;
    }
    
    // ცარიელი ფაილის შემოწმება
    if (file.size === 0) {
      this.showSnackBar('არჩეული ფაილი ცარიელია');
      return;
    }
    
    if (type === 'profile') {
      this.handleProfileImageSelection(file);
    } else if (type === 'product') {
      this.handleProductImageSelection(file);
    }
  }
  
  private handleProfileImageSelection(file: File): void {
    console.log('Processing profile image:', file.name);
    this.isUploading = true;
    
    // პრევიუს სურათის ჩვენება
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const previewElement = document.getElementById('profileImagePreview') as HTMLImageElement;
      if (previewElement && e.target?.result) {
        previewElement.src = e.target.result as string;
        console.log('Profile image preview updated successfully');
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading profile image file:', error);
      this.showSnackBar('სურათის წაკითხვისას დაფიქსირდა შეცდომა');
      this.isUploading = false;
    };
    
    reader.readAsDataURL(file);
    
    // პროფილის სურათის განახლება
    this.authService.updateProfileImage(file)
      .pipe(finalize(() => this.isUploading = false))
      .subscribe({
        next: (response) => {
          console.log('Profile image updated successfully');
          this.showSnackBar('პროფილის სურათი განახლდა');
        },
        error: (error) => {
          console.error('Profile image update error:', error);
          this.showSnackBar('პროფილის სურათის განახლება ვერ მოხერხდა');
          
          // Restore previous image if available
          if (this.currentUser?.profileImage) {
            const previewElement = document.getElementById('profileImagePreview') as HTMLImageElement;
            if (previewElement) {
              previewElement.src = this.currentUser.profileImage;
            }
          }
        }
      });
  }
  
  private handleProductImageSelection(file: File): void {
    console.log('Processing product image:', file.name);
    this.productImage = file;
    
    // პრევიუს სურათის ჩვენება
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        this.productImagePreview = e.target.result as string;
        console.log('Product image preview updated successfully');
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading product image file:', error);
      this.showSnackBar('პროდუქტის სურათის წაკითხვისას დაფიქსირდა შეცდომა');
      this.productImage = null;
      this.productImagePreview = null;
    };
    
    reader.readAsDataURL(file);
  }

  toggleProductForm(): void {
    if (!this.productFormVisible && this.userProducts.length >= this.MAX_PRODUCTS_ALLOWED) {
      this.showSnackBar(`თქვენ არ შეგიძლიათ ${this.MAX_PRODUCTS_ALLOWED}-ზე მეტი პროდუქტის დამატება`);
      return;
    }
    
    this.productFormVisible = !this.productFormVisible;
    if (!this.productFormVisible) {
      this.resetProductForm();
    }
  }
  
 addProduct(): void {
  if (this.productForm.invalid) {
    this.showSnackBar('გთხოვთ შეავსოთ ყველა საჭირო ველი');
    return;
  }
  
  if (!this.productImage) {
    this.showSnackBar('გთხოვთ აირჩიოთ პროდუქტის სურათი');
    return;
  }
  
  if (this.userProducts.length >= this.MAX_PRODUCTS_ALLOWED) {
    this.showSnackBar(`თქვენ არ შეგიძლიათ ${this.MAX_PRODUCTS_ALLOWED}-ზე მეტი პროდუქტის დამატება`);
    return;
  }
  
  // ფორმის მნიშვნელობების ლოგირება debug-ისთვის
  console.log('Form values:', this.productForm.value);
  console.log('Phone value:', this.productForm.value.phone);
  console.log('Email value:', this.productForm.value.email);
  
  const formData = new FormData();
  formData.append('title', this.productForm.value.title || '');
  formData.append('category', this.productForm.value.category || '');
  formData.append('year', this.productForm.value.year?.toString() || '');
  formData.append('price', this.productForm.value.price?.toString() || '');
  formData.append('description', this.productForm.value.description || '');
  formData.append('location', this.productForm.value.location || '');
  
  // ზუსტად ასე გადაეცი phone და email
  formData.append('phone', this.productForm.value.phone || '');
  formData.append('email', this.productForm.value.email || '');
  formData.append('productImage', this.productImage);

  // შეამოწმე რა გადაეცემა formData-ში
  console.log('FormData content:');
  for (const [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

  this.isUploading = true;

  this.productService.addProduct(formData)
    .pipe(finalize(() => this.isUploading = false))
    .subscribe({
      next: (response) => {
        console.log('Server response:', response);
        this.showSnackBar('პროდუქტი წარმატებით დაემატა');
        this.resetProductForm();
        this.loadUserProducts();
        this.productFormVisible = false;
      },
      error: (error) => {
        console.error('პროდუქტის დამატების შეცდომა:', error);
        this.showSnackBar('პროდუქტის დამატება ვერ მოხერხდა');
      }
    });
}
  deleteProduct(productId: string): void {
    if (confirm('ნამდვილად გსურთ პროდუქტის წაშლა?')) {
      this.productService.deleteProduct(productId).subscribe({
        next: () => {
          this.showSnackBar('პროდუქტი წარმატებით წაიშალა');
          this.loadUserProducts();
        },
        error: (error) => {
          console.error('პროდუქტის წაშლის შეცდომა:', error);
          this.showSnackBar('პროდუქტის წაშლა ვერ მოხერხდა');
        }
      });
    }
  }
  
  resetProductForm(): void {
    this.productForm.reset();
    this.productImage = null;
    this.productImagePreview = null;
  }
  
  canAddMoreProducts(): boolean {
    return this.userProducts.length < this.MAX_PRODUCTS_ALLOWED;
  }
  
  getRemainingProductsCount(): number {
    return Math.max(0, this.MAX_PRODUCTS_ALLOWED - this.userProducts.length);
  }
  
  showSnackBar(message: string): void {
    this.snackBar.open(message, 'დახურვა', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}