// dashboard.component.ts
import { Component, OnInit, ViewChild, ElementRef, NgZone, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';
import { ImageCompressionService } from '../services/image-compression.service';
import { User } from '../models/user.model';
import { Product } from '../models/product';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientModule } from '@angular/common/http';
import { finalize, catchError, timeout, retry } from 'rxjs/operators';
import { of } from 'rxjs';
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardComponent implements OnInit {
  @ViewChild('profileInput', { static: false }) profileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('productInput1', { static: false }) productInput1Ref!: ElementRef<HTMLInputElement>;
  @ViewChild('productInput2', { static: false }) productInput2Ref!: ElementRef<HTMLInputElement>;
  @ViewChild('productInput3', { static: false }) productInput3Ref!: ElementRef<HTMLInputElement>;

  currentUser: User | null = null;
  productFormVisible: boolean = false;
  isUploading: boolean = false;
  isCompressing: boolean = false;
  userProducts: Product[] = [];

  
  
  
  readonly MAX_PRODUCTS_ALLOWED: number = 5;
  readonly MAX_PRODUCT_IMAGES: number = 3;
  
  productForm = new FormGroup({
    title: new FormControl<string>('', [Validators.required]),
    category: new FormControl<string>('', [Validators.required]),
    year: new FormControl<number | null>(null, [Validators.required, Validators.min(2000), Validators.max(new Date().getFullYear())]),
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    description: new FormControl<string>('', [Validators.required]),
    phone: new FormControl<string>('', [Validators.required, Validators.pattern(/^\+?\d{9,15}$/)]),
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    city: new FormControl<string>('', [Validators.required])
  });
  
  // მრავალი სურათისთვის arrays
  productImages: (File | null)[] = [null, null, null];
  productImagePreviews: (string | null)[] = [null, null, null];
  
  // კატეგორიებისა და ქალაქების controls
  categoryControl = new FormControl('');
  cityControl = new FormControl('');
  

  filteredCategories: string[] = [];
  filteredCities: string[] = [];

  categories: string[] = [
     'ტელეფონები',
     'ტექნიკა',
     'ავტომობილები',
     'ტანსაცმელი',
     'სათამაშოები',
     'კომპიუტერები',
  ];
  
  
  public cities: string[] = [
    'თბილისი',
    'ბათუმი',
    'ქუთაისი',
    'რუსთავი',
    'გორი',
    'ფოთი',
    'ზუგდიდი',
    'თელავი',
    'ოზურგეთი',
    'მარნეული',
    'ახალციხე',
    'ახალქალაქი',
    'ბოლნისი',
    'საგარეჯო',
    'გარდაბანი',
    'ცხინვალი',
    'ჭიათურა',
    'დუშეთი',
    'დმანისი',
    'წალკა',
    'თეთრიწყარო',
    'საჩხერე',
    'ლაგოდეხი',
    'ყვარელი',
    'თიანეთი',
    'კასპი',
    'ხაშური',
    'ხობი',
    'წალენჯიხა',
    'მესტია',
    'ამბროლაური',
    'ცაგერი',
    'ონი',
    'ლანჩხუთი',
    'ჩოხატაური',
    'ქობულეთი',
    'სურამი',
    'აბაშა',
    'სენაკი',
    'ტყიბული',
    'წყალტუბო',
    'ნინოწმინდა',
    'ცაგერი',
    'ბაკურიანი',
    'გუდაური',
    'წნორი',
    'ახმეტა',
    'ბარნოვი',
    'ყვარელი',
    'შორაპანი',
    'სოხუმი', 
  ];

  private isAndroidChrome = false;

  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private imageCompressionService: ImageCompressionService,
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
    
    // კატეგორიების ფილტრაცია
    this.productForm.get('category')?.valueChanges
      .pipe(
        startWith(''),
        map((value: string | null) => (value ? this._filterCategories(value) : this.categories.slice()))
      )
      .subscribe((filtered: string[]) => {
        this.filteredCategories = filtered;
      });

    // ქალაქების ფილტრაცია
    this.productForm.get('city')?.valueChanges
      .pipe(
        startWith(''),
        map((value: string | null) => (value ? this._filterCities(value) : this.cities.slice()))
      )
      .subscribe((filtered: string[]) => {
        this.filteredCities = filtered;
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

  private _filterCities(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.cities.filter(city =>
      city.toLowerCase().includes(filterValue)
    );
  }
  
  // გაუმჯობესებული loadUserProducts მეთოდი
  loadUserProducts(): void {
    this.productService.getUserProducts()
      .pipe(
        timeout(10000),
        retry(1),
        catchError((error) => {
          console.error('პროდუქტების ჩატვირთვის შეცდომა:', error);
          this.showSnackBar('პროდუქტების ჩატვირთვა ვერ მოხერხდა: ' + error.message);
          return of({ products: [] });
        })
      )
      .subscribe({
        next: (response) => {
          this.userProducts = response.products;
          console.log('მომხმარებლის პროდუქტები ჩაიტვირთა:', this.userProducts.length);
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

        if (this.isAndroidChrome) {
          this.handleAndroidChromeFileInput(fileInput, 'profile');
        } else {
          this.handleStandardFileInput(fileInput);
        }

      } catch (error) {
        console.error('Error triggering profile file input:', error);
        this.showSnackBar('ფაილის არჩევისას დაფიქსირდა შეცდომა');
      }
    });
  }

  triggerProductImageInput(imageIndex: number): void {
    this.ngZone.run(() => {
      try {
        const fileInput = document.getElementById(`productImageInput${imageIndex + 1}`) as HTMLInputElement;
        
        if (!fileInput) {
          console.error(`Product image input ${imageIndex + 1} not found`);
          this.showSnackBar('ფაილის არჩევის ველი ვერ მოიძებნა');
          return;
        }

        console.log(`Triggering product file input ${imageIndex + 1}, Android Chrome:`, this.isAndroidChrome);

        if (this.isAndroidChrome) {
          this.handleAndroidChromeFileInput(fileInput, 'product', imageIndex);
        } else {
          this.handleStandardFileInput(fileInput);
        }

      } catch (error) {
        console.error(`Error triggering product file input ${imageIndex + 1}:`, error);
        this.showSnackBar('ფაილის არჩევისას დაფიქსირდა შეცდომა');
      }
    });
  }

  private handleAndroidChromeFileInput(fileInput: HTMLInputElement, type: 'profile' | 'product', imageIndex?: number): void {
    console.log('Handling Android Chrome file input for:', type, imageIndex !== undefined ? `index: ${imageIndex}` : '');
    
    fileInput.value = '';
    fileInput.removeAttribute('value');
    
    const touchEvents = ['touchstart', 'touchend', 'click'];
    
    let attemptCount = 0;
    const maxAttempts = 3;
    
    const attemptClick = () => {
      attemptCount++;
      console.log(`Attempt ${attemptCount} to trigger file input`);
      
      try {
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
        
        fileInput.focus();
        
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
    
    requestAnimationFrame(() => {
      attemptClick();
    });
  }

  private handleStandardFileInput(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    
    requestAnimationFrame(() => {
      fileInput.click();
    });
  }

  onFileSelected(event: Event, type: 'profile' | 'product', imageIndex?: number): void {
    this.ngZone.run(() => {
      try {
        const input = event.target as HTMLInputElement;
        
        console.log('File selection event triggered for:', type, imageIndex !== undefined ? `index: ${imageIndex}` : '');
        console.log('Input element:', input);
        console.log('Files found:', input?.files?.length || 0);
        
        if (!input || !input.files || input.files.length === 0) {
          console.warn('No file selected immediately, checking for delayed selection...');
          
          const checkDelayedSelection = (attempt: number = 1) => {
            setTimeout(() => {
              console.log(`Delayed check attempt ${attempt}`);
              if (input?.files && input.files.length > 0) {
                console.log('Delayed file detection successful:', input.files[0].name);
                this.processSelectedFile(input.files[0], type, imageIndex);
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
        
        const file = input.files[0];
        console.log('File selected immediately:', file.name);
        this.processSelectedFile(file, type, imageIndex);
        
      } catch (error) {
        console.error('Error in file selection handler:', error);
        this.showSnackBar('სურათის არჩევისას დაფიქსირდა შეცდომა');
      }
    });
  }

  onAlternativeFileSelected(event: Event, type: 'profile' | 'product', imageIndex?: number): void {
    console.log('Alternative file selection triggered for:', type, imageIndex !== undefined ? `index: ${imageIndex}` : '');
    this.onFileSelected(event, type, imageIndex);
  }

  private async processSelectedFile(file: File, type: 'profile' | 'product', imageIndex?: number): Promise<void> {
    console.log('Processing selected file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      imageIndex: imageIndex
    });
    
    if (!file.type.startsWith('image/')) {
      this.showSnackBar('გთხოვთ აირჩიოთ მხოლოდ სურათი');
      return;
    }
    
    if (file.size === 0) {
      this.showSnackBar('არჩეული ფაილი ცარიელია');
      return;
    }
    
    const maxOriginalSize = 20 * 1024 * 1024;
    if (file.size > maxOriginalSize) {
      this.showSnackBar('სურათის ზომა არ უნდა აღემატებოდეს 20MB-ს');
      return;
    }

    try {
      this.isCompressing = true;
      this.showSnackBar('სურათი მუშავდება...');
      
      const compressionOptions = {
        maxWidth: type === 'profile' ? 512 : 1920,
        maxHeight: type === 'profile' ? 512 : 1080,
        quality: 0.8,
        maxSizeInMB: type === 'profile' ? 1 : 3,
        format: 'jpeg' as const
      };

      console.log(`Starting compression for ${type} image...`);
      console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

      const compressedFile = await this.imageCompressionService.compressImage(file, compressionOptions);
      
      console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Compression ratio: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`);
      
      if (type === 'profile') {
        await this.handleProfileImageSelection(compressedFile);
      } else if (type === 'product' && imageIndex !== undefined) {
        await this.handleProductImageSelection(compressedFile, imageIndex);
      }
      
    } catch (error) {
      console.error('Image compression error:', error);
      this.showSnackBar('სურათის დამუშავებისას დაფიქსირდა შეცდომა');
    } finally {
      this.isCompressing = false;
    }
  }
  
  private async handleProfileImageSelection(file: File): Promise<void> {
    console.log('Processing profile image:', file.name);
    this.isUploading = true;
    
    try {
      const previewUrl = await this.createImagePreview(file);
      const previewElement = document.getElementById('profileImagePreview') as HTMLImageElement;
      if (previewElement) {
        previewElement.src = previewUrl;
        console.log('Profile image preview updated successfully');
      }
    } catch (error) {
      console.error('Error creating profile image preview:', error);
      this.showSnackBar('სურათის პრევიუს შექმნისას დაფიქსირდა შეცდომა');
    }
    
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
          
          if (this.currentUser?.profileImage) {
            const previewElement = document.getElementById('profileImagePreview') as HTMLImageElement;
            if (previewElement) {
              previewElement.src = this.currentUser.profileImage;
            }
          }
        }
      });
  }
  
  private async handleProductImageSelection(file: File, imageIndex: number): Promise<void> {
    console.log(`Processing product image ${imageIndex + 1}:`, file.name);
    
    if (imageIndex < 0 || imageIndex >= this.MAX_PRODUCT_IMAGES) {
      console.error('Invalid image index:', imageIndex);
      return;
    }
    
    this.productImages[imageIndex] = file;
    
    try {
      this.productImagePreviews[imageIndex] = await this.createImagePreview(file);
      console.log(`Product image ${imageIndex + 1} preview updated successfully`);
    } catch (error) {
      console.error(`Error creating product image ${imageIndex + 1} preview:`, error);
      this.showSnackBar(`პროდუქტის სურათის ${imageIndex + 1} პრევიუს შექმნისას დაფიქსირდა შეცდომა`);
      this.productImages[imageIndex] = null;
      this.productImagePreviews[imageIndex] = null;
    }
  }

  removeProductImage(imageIndex: number): void {
    if (imageIndex >= 0 && imageIndex < this.MAX_PRODUCT_IMAGES) {
      this.productImages[imageIndex] = null;
      this.productImagePreviews[imageIndex] = null;
      console.log(`Product image ${imageIndex + 1} removed`);
    }
  }

  hasProductImages(): boolean {
    return this.productImages.some(image => image !== null);
  }

  getUploadedImagesCount(): number {
    return this.productImages.filter(image => image !== null).length;
  }

  private createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
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
  
  // განახლებული addProduct მეთოდი
  addProduct(): void {
    if (this.productForm.invalid) {
      this.showSnackBar('გთხოვთ შეავსოთ ყველა საჭირო ველი');
      return;
    }
    
    if (!this.hasProductImages()) {
      this.showSnackBar('გთხოვთ აირჩიოთ მინიმუმ ერთი პროდუქტის სურათი');
      return;
    }
    
    if (this.userProducts.length >= this.MAX_PRODUCTS_ALLOWED) {
      this.showSnackBar(`თქვენ არ შეგიძლიათ ${this.MAX_PRODUCTS_ALLOWED}-ზე მეტი პროდუქტის დამატება`);
      return;
    }
    
    console.log('Form values:', this.productForm.value);
    console.log('Uploaded images count:', this.getUploadedImagesCount());
    
    // პირველ რიგში შევამოწმოთ კონექცია
    this.productService.checkConnection().subscribe({
      next: () => {
        console.log('კონექცია წარმატებულია, ვაგრძელებთ პროდუქტის დამატებას');
        this.performAddProduct();
      },
      error: (error) => {
        console.error('კონექციის შეცდომა:', error);
        this.showSnackBar('სერვერთან კავშირი ვერ დამყარდა. გთხოვთ შეამოწმოთ ინტერნეტი.');
      }
    });
  }

  private performAddProduct(): void {
    const formData = new FormData();
    
    // ძირითადი ინფორმაცია
    formData.append('title', this.productForm.value.title || '');
    formData.append('category', this.productForm.value.category || '');
    formData.append('year', this.productForm.value.year?.toString() || '');
    formData.append('price', this.productForm.value.price?.toString() || '');
    formData.append('description', this.productForm.value.description || '');
    formData.append('city', this.productForm.value.city || '');
    formData.append('phone', this.productForm.value.phone || '');
    formData.append('email', this.productForm.value.email || '');
    
    // სურათების დამატება
    let imageCount = 0;
    this.productImages.forEach((image, index) => {
      if (image) {
        formData.append(`productImage${index + 1}`, image);
        imageCount++;
        console.log(`Added image ${index + 1}:`, image.name);
      }
    });

    console.log(`სულ ${imageCount} სურათი დაემატა FormData-ში`);
    
    // FormData-ს შემთხვევაების დალოგვა
    console.log('FormData content:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(`${key}:`, value);
      }
    }

    this.isUploading = true;
    this.showSnackBar('პროდუქტი იტვირთება...');

    this.productService.addProduct(formData)
      .pipe(
        timeout(60000), // 60 წამი timeout
        retry(2), // 2-ჯერ retry
        finalize(() => {
          this.isUploading = false;
        }),
        catchError((error) => {
          console.error('პროდუქტის დამატების შეცდომა:', error);
          
          // სხვადასხვა შეცდომის ტიპების დამუშავება
          if (error.message.includes('ქსელის შეცდომა')) {
            this.showSnackBar('ქსელის შეცდომა - შეამოწმეთ ინტერნეტი');
          } else if (error.message.includes('ავტორიზაციის შეცდომა')) {
            this.showSnackBar('ავტორიზაციის შეცდომა - გთხოვთ ხელახლა შეხვიდეთ');
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          } else {
            this.showSnackBar('პროდუქტის დამატება ვერ მოხერხდა: ' + error.message);
          }
          
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            console.log('Server response:', response);
            this.showSnackBar('პროდუქტი წარმატებით დაემატა');
            this.resetProductForm();
            this.loadUserProducts();
            this.productFormVisible = false;
          }
        },
        error: (error) => {
          // ეს არ უნდა მოხდეს რადგან catchError-ი ყველა შეცდომას იჭერს
          console.error('Unexpected error:', error);
          this.showSnackBar('მოულოდნელი შეცდომა');
        }
      });
  }

  // დამატებითი მეთოდი კონექციის შესამოწმებლად
  checkServerConnection(): void {
    this.productService.checkConnection().subscribe({
      next: () => {
        this.showSnackBar('სერვერთან კავშირი წარმატებულია');
      },
      error: (error) => {
        console.error('Server connection error:', error);
        this.showSnackBar('სერვერთან კავშირი ვერ დამყარდა');
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
    this.productImages = [null, null, null];
    this.productImagePreviews = [null, null, null];
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
  getAllProductImages(product: Product): string[] {
  const images: string[] = [];
  
  // ახალი images array-ის მხარდაჭერა
  if (product.images && product.images.length > 0) {
    images.push(...product.images);
  }
  
  // ძველი image ველის მხარდაჭერა
  if (product.image && !images.includes(product.image)) {
    images.push(product.image);
  }
  
  // ძველი productImage1, productImage2, productImage3 ველების მხარდაჭერა
  if (product.productImage1 && !images.includes(product.productImage1)) {
    images.push(product.productImage1);
  }
  if (product.productImage2 && !images.includes(product.productImage2)) {
    images.push(product.productImage2);
  }
  if (product.productImage3 && !images.includes(product.productImage3)) {
    images.push(product.productImage3);
  }
  
  // ფილტრაცია: მხოლოდ ვალიდური სურათები
  return images.filter(img => img && img.trim() !== '');
}

// შეგიძლია დაამატო დამატებითი მეთოდი primary image-ისთვის:
getPrimaryImage(product: Product): string {
  const images = this.getAllProductImages(product);
  return images.length > 0 ? images[0] : '/assets/default-product.jpg';
}

// და რაოდენობის დასადგენად:
getImageCount(product: Product): number {
  return this.getAllProductImages(product).length;
}

  get isProcessing(): boolean {
    return this.isUploading || this.isCompressing;
  }

  onImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (img) {
    console.log('Image load error:', img.src);
    img.src = '/assets/default-product.jpg'; // default image
    img.alt = 'სურათი ვერ ჩაიტვირთა';
  }
}

// პროდუქტში სურათის არსებობის შესამოწმებლად
hasValidImages(product: Product): boolean {
  return this.getAllProductImages(product).length > 0;
}

// სურათის URL-ის ვალიდაციისთვის
isValidImageUrl(url: string): boolean {
  return typeof url === 'string' && url.trim() !== '' && !url.includes('undefined') && !url.includes('null');
}
}