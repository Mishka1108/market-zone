import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
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

  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}
  
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

  // გამოსწორებული მეთოდი Android Chrome-ისთვის
  triggerFileInput(): void {
    try {
      const fileInput = document.getElementById('profileImageInput') as HTMLInputElement;
      if (fileInput) {
        // Android Chrome-ისთვის საჭირო ცვლილებები
        fileInput.value = '';
        
        // User gesture-ის შესანარჩუნებლად
        this.addClickEventListener(fileInput, () => {
          console.log('Profile image input clicked');
        });
        
        // Force click with proper timing
        requestAnimationFrame(() => {
          fileInput.click();
        });
      } else {
        console.error('Profile image input not found');
        this.showSnackBar('ფაილის არჩევის ველი ვერ მოიძებნა');
      }
    } catch (error) {
      console.error('Error triggering file input:', error);
      this.showSnackBar('ფაილის არჩევისას დაფიქსირდა შეცდომა');
    }
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
  
  // გამოსწორებული მეთოდი პროდუქტის სურათისთვის
  triggerProductImageInput(): void {
    try {
      const fileInput = document.getElementById('productImageInput') as HTMLInputElement;
      if (fileInput) {
        // Android Chrome-ისთვის საჭირო ცვლილებები
        fileInput.value = '';
        
        // User gesture-ის შესანარჩუნებლად
        this.addClickEventListener(fileInput, () => {
          console.log('Product image input clicked');
        });
        
        // Force click with proper timing
        requestAnimationFrame(() => {
          fileInput.click();
        });
      } else {
        console.error('Product image input not found');
        this.showSnackBar('ფაილის არჩევის ველი ვერ მოიძებნა');
      }
    } catch (error) {
      console.error('Error triggering product image input:', error);
      this.showSnackBar('ფაილის არჩევისას დაფიქსირდა შეცდომა');
    }
  }

  // დამხმარე მეთოდი Android Chrome-ისთვის
  private addClickEventListener(element: HTMLElement, callback: () => void): void {
    const clickHandler = () => {
      callback();
      element.removeEventListener('click', clickHandler);
    };
    element.addEventListener('click', clickHandler);
  }

  // გაუმჯობესებული onFileSelected მეთოდი
  onFileSelected(event: Event, type: 'profile' | 'product'): void {
    try {
      const input = event.target as HTMLInputElement;
      
      console.log('File selection triggered for:', type);
      console.log('Input:', input);
      console.log('Files:', input?.files);
      
      if (!input || !input.files || input.files.length === 0) {
        console.warn('No file selected or input is invalid');
        // Android Chrome-ში ზოგჯერ delayed file selection ხდება
        setTimeout(() => {
          if (input?.files && input.files.length > 0) {
            console.log('Delayed file detection:', input.files[0]);
            this.processSelectedFile(input.files[0], type);
          }
        }, 100);
        return;
      }
      
      const file = input.files[0];
      this.processSelectedFile(file, type);
      
    } catch (error) {
      console.error('Error in file selection:', error);
      this.showSnackBar('სურათის არჩევისას დაფიქსირდა შეცდომა');
    }
  }

  // ფაილის დამუშავების ცალკე მეთოდი
  private processSelectedFile(file: File, type: 'profile' | 'product'): void {
    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
    
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
    
    if (type === 'profile') {
      this.handleProfileImageSelection(file);
    } else if (type === 'product') {
      this.handleProductImageSelection(file);
    }
  }
  
  private handleProfileImageSelection(file: File): void {
    console.log('Handling profile image selection:', file.name);
    this.isUploading = true;
    
    // პრევიუს სურათის ჩვენება
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const previewElement = document.getElementById('profileImagePreview') as HTMLImageElement;
      if (previewElement && e.target?.result) {
        previewElement.src = e.target.result as string;
        console.log('Profile image preview updated');
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file for preview:', error);
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
          console.error('პროფილის სურათის განახლების შეცდომა', error);
          this.showSnackBar('პროფილის სურათის განახლება ვერ მოხერხდა');
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
    console.log('Handling product image selection:', file.name);
    this.productImage = file;
    
    // პრევიუს სურათის ჩვენება
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        this.productImagePreview = e.target.result as string;
        console.log('Product image preview updated');
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading product image file for preview:', error);
      this.showSnackBar('პროდუქტის სურათის წაკითხვისას დაფიქსირდა შეცდომა');
      this.productImage = null;
      this.productImagePreview = null;
    };
    reader.readAsDataURL(file);
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
    
    const formData = new FormData();
    formData.append('title', this.productForm.value.title || '');
    formData.append('category', this.productForm.value.category || '');
    formData.append('year', this.productForm.value.year?.toString() || '');
    formData.append('price', this.productForm.value.price?.toString() || '');
    formData.append('description', this.productForm.value.description || '');
    formData.append('location', this.productForm.value.location || '');
    formData.append('phone', this.productForm.value.phone || '');
    formData.append('email', this.productForm.value.email || '');
    formData.append('productImage', this.productImage);

    this.isUploading = true;

    this.productService.addProduct(formData)
      .pipe(finalize(() => this.isUploading = false))
      .subscribe({
        next: (response) => {
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
      duration: 1000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}