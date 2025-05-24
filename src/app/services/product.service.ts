import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Product } from '../models/product';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ავთენტიფიკაციის ტოკენის მიღება
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // პროდუქტის დამატება (მხოლოდ ავტორიზებული მომხმარებლისთვის)
  addProduct(productData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/products`, productData, {
      headers: this.getHeaders()
    });
  }

  // მომხმარებლის პროდუქტების მიღება (მხოლოდ ავტორიზებული მომხმარებლისთვის)
  getUserProducts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/products/user`, {
      headers: this.getHeaders()
    });
  }

  // პროდუქტის წაშლა (მხოლოდ ავტორიზებული მომხმარებლისთვის)
  deleteProduct(productId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/products/${productId}`, {
      headers: this.getHeaders()
    });
  }

  // ყველა პროდუქტის მიღება (საჯაროდ ხელმისაწვდომი)
  getAllProducts(filters?: {
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    search?: string
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.category) {
        params = params.append('category', filters.category);
      }
      if (filters.minPrice) {
        params = params.append('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice) {
        params = params.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters.search) {
        params = params.append('search', filters.search);
      }
    }
    
    return this.http.get(`${this.baseUrl}/products`, { params });
  }

  // კონკრეტული პროდუქტის მიღება ID-ით (საჯაროდ ხელმისაწვდომი)
  getProductById(productId: string): Observable<any> {
    console.log(`მოითხოვება პროდუქტი ID-ით: ${productId}`);
    return this.http.get(`${this.baseUrl}/products/${productId}`).pipe(
      tap((response: any) => {
        console.log('მიღებული პროდუქტის მონაცემები:', response);
      }),
      map((response: any) => {
        // გარდავქმნათ API პასუხი, რომ დავრწმუნდეთ რომ მომხმარებლის კონტაქტები არის ხელმისაწვდომი
        let product;
        
        // განვსაზღვროთ პროდუქტის ობიექტი
        if (response.product) {
          product = response.product;
        } else {
          product = response;
        }
        
        // მომხმარებლის ინფორმაციის გამოტანა სხვადასხვა შესაძლო წყაროებიდან
        
        // 1. თუ მომხმარებლის ინფორმაცია არის user ობიექტში
        if (product.user) {
          product.userName = product.user.name || product.user.firstName || '';
          product.userEmail = product.user.email || '';
          product.userPhone = product.user.phone || '';
        }
        
        // 2. თუ მომხმარებლის ინფორმაცია არის seller ობიექტში
        if (product.seller && (!product.userName || !product.userEmail || !product.userPhone)) {
          product.userName = product.userName || product.seller.name || product.seller.firstName || product.sellerName || '';
          product.userEmail = product.userEmail || product.seller.email || product.sellerEmail || '';
          product.userPhone = product.userPhone || product.seller.phone || product.sellerPhone || '';
        }
        
        // 3. თუ მომხმარებლის ინფორმაცია არის პირდაპირ პროდუქტის ობიექტში
        product.userName = product.userName || product.sellerName || '';
        product.userEmail = product.userEmail || product.sellerEmail || product.email || '';
        product.userPhone = product.userPhone || product.sellerPhone || product.phone || '';
        
        // 4. თუ მომხმარებლის ინფორმაცია არის owner ობიექტში
        if (product.owner && (!product.userName || !product.userEmail || !product.userPhone)) {
          product.userName = product.userName || product.owner.name || product.owner.firstName || '';
          product.userEmail = product.userEmail || product.owner.email || '';
          product.userPhone = product.userPhone || product.owner.phone || '';
        }
        
        // მონაცემების კონსოლში გამოტანა დებაგისთვის
        console.log('გარდაქმნილი პროდუქტის ობიექტი:', product);
        console.log('მომხმარებლის საკონტაქტო ინფორმაცია:', {
          userName: product.userName,
          userEmail: product.userEmail,
          userPhone: product.userPhone
        });
        
        // დავაბრუნოთ იგივე სტრუქტურის ობიექტი რაც API-დან მივიღეთ
        if (response.product) {
          return { product };
        } else {
          return product;
        }
      })
    );
  }
}