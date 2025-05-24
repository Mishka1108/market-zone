// product.component.ts ფაილი

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog.component';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,MatIcon
  ],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit {
  products: Product[] = [];
  isLoading: boolean = true;

  constructor(
    private productService: ProductService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getUserProducts().subscribe({
      next: (response) => {
        console.log('პროდუქტების პასუხი:', response);
        this.products = response.products.map((product: any) => ({
          ...product,
          id: product._id
        }));
  
        this.products.forEach((product, index) => {
          if (!product.id) {
            console.warn(`პროდუქტს ინდექსით ${index} არ აქვს ID:`, product);
          }
        });
  
        this.isLoading = false;
      },
      error: (error) => {
        console.error('პროდუქტების ჩატვირთვის შეცდომა:', error);
        this.showSnackBar('პროდუქტების ჩატვირთვა ვერ მოხერხდა');
        this.isLoading = false;
      }
    });
  }
  
  // განახლებული მეთოდი უსაფრთხოების შემოწმებით
  deleteProduct(productId: string): void {
    if (!productId) {
      this.showSnackBar('პროდუქტის ID არ არის მითითებული');
      return;
    }
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { 
        title: 'პროდუქტის წაშლა', 
        message: 'ნამდვილად გსურთ პროდუქტის წაშლა?' 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.productService.deleteProduct(productId).subscribe({
          next: () => {
            this.products = this.products.filter(product => product.id !== productId);
            this.showSnackBar('პროდუქტი წარმატებით წაიშალა');
            this.isLoading = false;
          },
          error: (error) => {
            console.error('პროდუქტის წაშლის შეცდომა:', error);
            this.showSnackBar('პროდუქტის წაშლა ვერ მოხერხდა');
            this.isLoading = false;
          }
        });
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  showSnackBar(message: string): void {
    this.snackBar.open(message, 'დახურვა', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
  viewProductDetails(product: Product): void {
    if (!product || !product.id) {
      this.showSnackBar('პროდუქტის ID არ არის მითითებული');
      return;
    }
    
    this.router.navigate(['/product-details', product.id]);
  }
  
}