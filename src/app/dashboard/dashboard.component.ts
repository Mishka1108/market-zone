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
  
  // კონსტანტა მაქსიმალური პროდუქტების რაოდენობისთვის
  readonly MAX_PRODUCTS_ALLOWED: number = 5;
  
  // პროდუქტის ფორმა
  productForm = new FormGroup({
    title: new FormControl<string>('', [Validators.required]),
    category: new FormControl<string>('', [Validators.required]),
    year: new FormControl<number | null>(null, [Validators.required, Validators.min(2000), Validators.max(new Date().getFullYear())]),
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    description: new FormControl<string>('', [Validators.required]),
    location: new FormControl<string>('', [Validators.required]), // დამატებული location ველი
  });
  
  // პროდუქტის სურათი
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
    // მომხმარებლის მონაცემების მიღება
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      
      if (!this.currentUser) {
        this.router.navigate(['/auth/login']);
      }
    });
  
    this.authService.refreshUserData().subscribe();
    
    // მომხმარებლის პროდუქტების მიღება
    this.loadUserProducts();
    
    // კატეგორიების ფილტრისთვის
    this.categoryControl.valueChanges
    .pipe(
      startWith(''),
      map((value: string | null) => (value ? this._filterCategories(value) : this.categories.slice()))
    )
    .subscribe((filtered: string[]) => {
      this.filteredCategories = filtered;
    });
  }
  
  // კატეგორიების ფილტრაცია
  private _filterCategories(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.categories.filter(category =>
      category.toLowerCase().includes(filterValue)
    );
  }
  
  // პროდუქტების ჩატვირთვა
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

  // პროფილის სურათის ატვირთვა
  triggerFileInput(): void {
    const fileInput = document.getElementById('profileImageInput') as HTMLInputElement;
    fileInput.click();
  }

  // პროდუქტის ფორმის ჩვენება
  toggleProductForm(): void {
    // თუ მომხმარებელს უკვე აქვს მაქსიმალური რაოდენობა და ცდილობს ფორმის გახსნას
    if (!this.productFormVisible && this.userProducts.length >= this.MAX_PRODUCTS_ALLOWED) {
      this.showSnackBar(`თქვენ არ შეგიძლიათ ${this.MAX_PRODUCTS_ALLOWED}-ზე მეტი პროდუქტის დამატება`);
      return;
    }
    
    this.productFormVisible = !this.productFormVisible;
    if (!this.productFormVisible) {
      this.resetProductForm();
    }
  }
  
  // პროდუქტის სურათის ატვირთვა
  triggerProductImageInput(): void {
    const fileInput = document.getElementById('productImageInput') as HTMLInputElement;
    fileInput.click();
  }

  // ფაილის არჩევისას
  onFileSelected(event: Event, type: 'profile' | 'product'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (type === 'profile') {
        this.isUploading = true;
        
        // პრევიუს სურათის ჩვენება
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const previewElement = document.getElementById('profileImagePreview') as HTMLImageElement;
          if (previewElement && e.target?.result) {
            previewElement.src = e.target.result as string;
          }
        };
        reader.readAsDataURL(file);
        
        // პროფილის სურათის განახლება
        this.authService.updateProfileImage(file)
          .pipe(finalize(() => this.isUploading = false))
          .subscribe({
            next: (response) => {
              this.showSnackBar('პროფილის სურათი განახლდა');
            },
            error: (error) => {
              console.error('პროფილის სურათის განახლების შეცდომა', error);
              this.showSnackBar('პროფილის სურათის განახლება ვერ მოხერხდა');
              // შეცდომის შემთხვევაში დაბრუნება საწყის სურათზე
              if (this.currentUser?.profileImage) {
                const previewElement = document.getElementById('profileImagePreview') as HTMLImageElement;
                if (previewElement) {
                  previewElement.src = this.currentUser.profileImage;
                }
              }
            }
          });
      } else if (type === 'product') {
        // პროდუქტის სურათი
        this.productImage = file;
        
        // პრევიუს სურათის ჩვენება
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          this.productImagePreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  }
  
  // პროდუქტის დამატება
  addProduct(): void {
    if (this.productForm.invalid) {
      this.showSnackBar('გთხოვთ შეავსოთ ყველა საჭირო ველი');
      return;
    }
    
    if (!this.productImage) {
      this.showSnackBar('გთხოვთ აირჩიოთ პროდუქტის სურათი');
      return;
    }
    
    // შემოწმება - აქვს თუ არა უკვე მაქსიმალური რაოდენობა
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
    formData.append('location', this.productForm.value.location || ''); // დამატებული location ველი
    formData.append('productImage', this.productImage);
    
    this.isUploading = true;
    
    this.productService.addProduct(formData)
      .pipe(finalize(() => this.isUploading = false))
      .subscribe({
        next: (response) => {
          this.showSnackBar('პროდუქტი წარმატებით დაემატა');
          this.resetProductForm();
          this.loadUserProducts(); // პროდუქტების სიის განახლება
          this.productFormVisible = false;
        },
        error: (error) => {
          console.error('პროდუქტის დამატების შეცდომა:', error);
          this.showSnackBar('პროდუქტის დამატება ვერ მოხერხდა');
        }
      });
  }
  
  // პროდუქტის წაშლა
  deleteProduct(productId: string): void {
    if (confirm('ნამდვილად გსურთ პროდუქტის წაშლა?')) {
      this.productService.deleteProduct(productId).subscribe({
        next: () => {
          this.showSnackBar('პროდუქტი წარმატებით წაიშალა');
          this.loadUserProducts(); // პროდუქტების სიის განახლება
        },
        error: (error) => {
          console.error('პროდუქტის წაშლის შეცდომა:', error);
          this.showSnackBar('პროდუქტის წაშლა ვერ მოხერხდა');
        }
      });
    }
  }
  
  // ფორმის გასუფთავება
  resetProductForm(): void {
    this.productForm.reset();
    this.productImage = null;
    this.productImagePreview = null;
  }
  
  // შემოწმება - შეუძლია თუ არა მომხმარებელს კიდევ პროდუქტების დამატება
  canAddMoreProducts(): boolean {
    return this.userProducts.length < this.MAX_PRODUCTS_ALLOWED;
  }
  
  // დარჩენილი პროდუქტების რაოდენობის გამოთვლა
  getRemainingProductsCount(): number {
    return Math.max(0, this.MAX_PRODUCTS_ALLOWED - this.userProducts.length);
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