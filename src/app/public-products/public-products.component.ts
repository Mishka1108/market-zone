import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User } from '../models/user.model';

@Component({
  selector: 'app-public-products',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatSnackBarModule
  ],
  templateUrl: './public-products.component.html',
  styleUrls: ['./public-products.component.scss']
})
export class PublicProductsComponent implements OnInit {
  products: Product[] = [];
  isLoading: boolean = true;
  pibliccurrentUser: User | null = null;
  
  // ფილტრების პარამეტრები  
  searchTerm: string = '';
  selectedCategory: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  
  // კატეგორიების სია
  categories: string[] = [
    'ტელეფონები',
    'ტექნიკა',
    'ავტომობილები',
    'ტანსაცმელი',
    'სათამაშოები',
    'კომპიუტერები'
  ];

  constructor(
    private productService: ProductService,
    private router: Router,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // ვუსმენთ query params ცვლილებებს
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
        console.log(`კატეგორია მიღებულია: ${this.selectedCategory}`);
      }
      this.loadProducts();
    });
  }

  // პროდუქტების ჩატვირთვა ფილტრებით ან ფილტრების გარეშე
  loadProducts(): void {
    this.isLoading = true;
    
    const filters: any = {};
    
    if (this.selectedCategory) {
      filters.category = this.selectedCategory;
      console.log(`ფილტრაცია კატეგორიით: ${this.selectedCategory}`);
    }
    
    if (this.minPrice) {
      filters.minPrice = this.minPrice;
    }
    
    if (this.maxPrice) {
      filters.maxPrice = this.maxPrice;
    }
    
    if (this.searchTerm) {
      filters.search = this.searchTerm;
    }
    
    this.productService.getAllProducts(filters).subscribe({
      next: (response) => {
        console.log('მიღებული პროდუქტები:', response);
        if (response.products) {
          this.products = response.products;
        } else if (Array.isArray(response)) {
          this.products = response;
        } else {
          this.products = [];
          this.showSnackBar('პროდუქტების მონაცემების ფორმატი არასწორია');
        }
        
        // შევამოწმოთ პროდუქტების სტრუქტურა
        if (this.products.length > 0) {
          console.log('პირველი პროდუქტის სტრუქტურა:', this.products[0]);
          
          // შევამოწმოთ აქვთ თუ არა ID ველი
          const hasIdField = this.products.every(product => product.id);
          console.log('ყველა პროდუქტს აქვს ID:', hasIdField);
          
          // შევამოწმოთ რა ველები აქვთ პროდუქტებს
          const firstProduct = this.products[0];
          const fields = Object.keys(firstProduct);
          console.log('პროდუქტის ველები:', fields);
          
          // თუ არ აქვთ id ველი, მაგრამ აქვთ სხვა უნიკალური იდენტიფიკატორი
          if (!hasIdField) {
            // შევამოწმოთ ალტერნატიული ველები (_id, productId, და ა.შ.)
            const possibleIdFields = ['_id', 'productId', 'product_id', 'uid'];
            
            for (const field of possibleIdFields) {
              if (firstProduct[field as keyof Product]) {
                console.log(`ნაპოვნია ალტერნატიული ID ველი: ${field}`);
                // დავარქვათ ამ ველს "id", რომ გამოვიყენოთ აპლიკაციაში
                this.products = this.products.map(product => ({
                  ...product,
                  id: String(product[field as keyof Product])
                }));
                break;
              }
            }
          }
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('პროდუქტების ჩატვირთვის შეცდომა:', error);
        this.showSnackBar('პროდუქტების ჩატვირთვა ვერ მოხერხდა');
        this.isLoading = false;
      }
    });
  }
  
  // ფილტრების გამოყენება
  applyFilters(): void {
    this.loadProducts();
  }

  // ძიების გასუფთავება
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  // ფილტრების გასუფთავება
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.loadProducts();
  }

  // პროდუქტის დეტალების გვერდზე გადასვლა
  openProductDetails(productId: string): void {
    if (!productId) {
      console.error('პროდუქტის ID ვერ მოიძებნა');
      this.showSnackBar('პროდუქტის ID ვერ მოიძებნა');
      return;
    }
    
    console.log('პროდუქტის დეტალების გვერდზე გადასვლა, ID:', productId);
    this.router.navigate(['/product-details', productId]);
  }

  // პროდუქტის ID-ის მიღება
  getProductId(product: Product): string {
    return product.id || product._id || product.productId || product.product_id || '';
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