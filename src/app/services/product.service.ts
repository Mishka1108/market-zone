import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError, retry, timeout } from 'rxjs/operators';
import { Product } from '../models/product';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { 
    console.log('ProductService initialized with baseUrl:', this.baseUrl);
  }

  // ავთენტიფიკაციის ტოკენის მიღება
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');
    
    return headers;
  }

  // FormData-სთვის სპეციალური headers
  private getFormDataHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    headers = headers.set('Accept', 'application/json');
    
    return headers;
  }

  // Error handling method
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('HTTP Error:', error);
    
    let errorMessage = 'უცნობი შეცდომა';
    
    if (error.status === 0) {
      errorMessage = 'ქსელის შეცდომა - შეამოწმეთ ინტერნეტი და სერვერის მდგომარეობა';
    } else if (error.status === 401) {
      errorMessage = 'ავტორიზაციის შეცდომა';
    } else if (error.status === 403) {
      errorMessage = 'წვდომა აკრძალულია';
    } else if (error.status === 404) {
      errorMessage = 'რესურსი ვერ მოიძებნა';
    } else if (error.status === 500) {
      errorMessage = 'სერვერის შეცდომა';
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // პროდუქტის დამატება
  addProduct(productData: FormData): Observable<any> {
    console.log('პროდუქტის დამატება იწყება...');
    console.log('API URL:', `${this.baseUrl}/products`);
    
    return this.http.post(`${this.baseUrl}/products`, productData, {
      headers: this.getFormDataHeaders()
    }).pipe(
      timeout(30000),
      retry(1),
      catchError(this.handleError),
      tap((response: any) => {
        console.log('პროდუქტი წარმატებით დაემატა:', response);
      })
    );
  }

  // მომხმარებლის პროდუქტების მიღება
  getUserProducts(): Observable<any> {
    console.log('მომხმარებლის პროდუქტების მიღება...');
    return this.http.get(`${this.baseUrl}/products/user`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      retry(1),
      catchError(this.handleError)
    );
  }

  // პროდუქტის წაშლა
  deleteProduct(productId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/products/${productId}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      retry(1),
      catchError(this.handleError)
    );
  }

  // ყველა პროდუქტის მიღება
  getAllProducts(filters?: {
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    search?: string
    city?: string
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.category) params = params.append('category', filters.category);
      if (filters.minPrice) params = params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params = params.append('maxPrice', filters.maxPrice.toString());
      if (filters.city) params = params.append('city', filters.city);
      if (filters.search) params = params.append('search', filters.search);
    }
    
    return this.http.get(`${this.baseUrl}/products`, { 
      params,
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      retry(1),
      catchError(this.handleError)
    );
  }

  // კონექციის შემოწმება - შეცვალე endpoint
  checkConnection(): Observable<any> {
    console.log('კონექციის შემოწმება:', `${this.baseUrl}/health`);
    return this.http.get(`${this.baseUrl}/health`, {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
    }).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('კონექციის შეცდომა:', error);
        return this.handleError(error);
      })
    );
  }

  // პროდუქტის ID-ით მიღება
  getProductById(productId: string): Observable<any> {
    console.log(`მოითხოვება პროდუქტი ID-ით: ${productId}`);
    return this.http.get(`${this.baseUrl}/products/${productId}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      retry(1),
      catchError(this.handleError),
      tap((response: any) => {
        console.log('API-დან მიღებული რო პასუხი:', response);
      }),
      map((response: any) => {
        let product = response.product || response;
        
        console.log('დამუშავებამდე პროდუქტი:', product);
        
        // კონტაქტის ინფორმაციის დამუშავება
        const contactSources = [
          {
            email: product.email,
            phone: product.phone,
            name: product.userName
          },
          {
            email: product.user?.email,
            phone: product.user?.phone,
            name: product.user?.name || product.user?.firstName
          },
          {
            email: product.seller?.email || product.sellerEmail,
            phone: product.seller?.phone || product.sellerPhone,
            name: product.seller?.name || product.seller?.firstName || product.sellerName
          },
          {
            email: product.owner?.email,
            phone: product.owner?.phone,
            name: product.owner?.name || product.owner?.firstName
          },
          {
            email: product.userEmail,
            phone: product.userPhone,
            name: product.userName
          }
        ];
        
        let finalContact = { email: '', phone: '', name: '' };
        
        for (const source of contactSources) {
          if (!finalContact.email && source.email) finalContact.email = source.email;
          if (!finalContact.phone && source.phone) finalContact.phone = source.phone;
          if (!finalContact.name && source.name) finalContact.name = source.name;
          
          if (finalContact.email && finalContact.phone && finalContact.name) break;
        }
        
        product.email = finalContact.email || 'არ არის მითითებული';
        product.phone = finalContact.phone || 'არ არის მითითებული';
        product.userName = finalContact.name || 'არ არის მითითებული';
        
        console.log('საბოლოო კონტაქტი:', finalContact);
        
        return response.product ? { product } : product;
      })
    );
  }

  // კატეგორიების მიღება
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/products/categories`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(5000),
      retry(1),
      catchError(this.handleError)
    );
  }

  // სტატისტიკის მიღება
  getProductStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/products/stats`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(5000),
      retry(1),
      catchError(this.handleError)
    );
  }
}