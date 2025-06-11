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

  // ყველა პროდუქტის მიღება (საჯაროდ ხელმისაწვდომი) - გაუმჯობესებული
  getAllProducts(filters?: {
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    search?: string
    city?: string
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
      if (filters.city) {
        params = params.append('city', filters.city);
      }
      if (filters.search) {
        params = params.append('search', filters.search);
      }
    }
    
    // საჯარო მოთხოვნა - არ გამოიყენოს headers
    return this.http.get(`${this.baseUrl}/products`, { params });
  }

  // ალტერნატიული მეთოდი საჯარო პროდუქტებისთვის
  getAllPublicProducts(filters?: {
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    search?: string
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.append(key, value.toString());
        }
      });
    }
    
    // სპეციალური endpoint საჯარო პროდუქტებისთვის (თუ backend-ზე არსებობს)
    return this.http.get(`${this.baseUrl}/products/public`, { params })
      .pipe(
        tap((response: any) => {
          console.log('საჯარო პროდუქტები ჩაიტვირთა:', response);
        })
      );
  }

  // გაუმჯობესებული getProductById მეთოდი
  getProductById(productId: string): Observable<any> {
    console.log(`მოითხოვება პროდუქტი ID-ით: ${productId}`);
    return this.http.get(`${this.baseUrl}/products/${productId}`).pipe(
      tap((response: any) => {
        console.log('API-დან მიღებული რო პასუხი:', response);
      }),
      map((response: any) => {
        // განვსაზღვროთ პროდუქტის ობიექტი
        let product = response.product || response;
        
        console.log('დამუშავებამდე პროდუქტი:', product);
        
        // ყველა შესაძლო მომხმარებლის კონტაქტის წყაროს შემოწმება
        const contactSources = [
          // პირდაპირ პროდუქტის ლეველზე
          {
            email: product.email,
            phone: product.phone,
            name: product.userName
          },
          // user ობიექტიდან
          {
            email: product.user?.email,
            phone: product.user?.phone,
            name: product.user?.name || product.user?.firstName
          },
          // seller ობიექტიდან
          {
            email: product.seller?.email || product.sellerEmail,
            phone: product.seller?.phone || product.sellerPhone,
            name: product.seller?.name || product.seller?.firstName || product.sellerName
          },
          // owner ობიექტიდან
          {
            email: product.owner?.email,
            phone: product.owner?.phone,
            name: product.owner?.name || product.owner?.firstName
          },
          // userEmail, userPhone ცვლადებიდან
          {
            email: product.userEmail,
            phone: product.userPhone,
            name: product.userName
          }
        ];
        
        // ვიპოვოთ პირველი ვალიდური კონტაქტი
        let finalContact = {
          email: '',
          phone: '',
          name: ''
        };
        
        for (const source of contactSources) {
          if (!finalContact.email && source.email) {
            finalContact.email = source.email;
          }
          if (!finalContact.phone && source.phone) {
            finalContact.phone = source.phone;
          }
          if (!finalContact.name && source.name) {
            finalContact.name = source.name;
          }
          
          // თუ ყველა საჭირო ინფორმაცია მოიძებნა, შევწყვიტოთ
          if (finalContact.email && finalContact.phone && finalContact.name) {
            break;
          }
        }
        
        // პროდუქტს დავუმატოთ საბოლოო კონტაქტი
        product.email = finalContact.email || 'არ არის მითითებული';
        product.phone = finalContact.phone || 'არ არის მითითებული';
        product.userName = finalContact.name || 'არ არის მითითებული';
        
        // დამატებითი ლოგი დებაგისთვის
        console.log('საბოლოო კონტაქტი:', finalContact);
        console.log('დამუშავების შემდეგ პროდუქტი:', {
          email: product.email,
          phone: product.phone,
          userName: product.userName,
          title: product.title
        });
        
        // დავაბრუნოთ სწორი სტრუქტურა
        return response.product ? { product } : product;
      }),
      tap((finalResponse: any) => {
        console.log('საბოლოო პასუხი რომელიც დაბრუნება:', finalResponse);
      })
    );
  }

  // კატეგორიების მიღება (საჯარო)
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/products/categories`);
  }

  // სტატისტიკის მიღება (საჯარო)
  getProductStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/products/stats`);
  }
}