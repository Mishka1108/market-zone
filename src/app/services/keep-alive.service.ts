// keep-alive.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeepAliveService implements OnDestroy {
  private readonly API_URL = 'https://your-app.onrender.com';
  private keepAliveSubscription?: Subscription;
  
  constructor(private http: HttpClient) {}

  startKeepAlive() {
    // თუ უკვე გაშვებულია, ჯერ გავაჩეროთ
    this.stopKeepAlive();
    
    // ყოველ 10 წუთში ping-ის გაგზავნა
    this.keepAliveSubscription = interval(10 * 60 * 1000).subscribe(() => {
      this.http.get(`${this.API_URL}/health`).pipe(
        // 30 წამიანი timeout
        timeout(30000),
        catchError(err => {
          console.error('Keep-alive failed:', err);
          return of(null); // ერორის შემთხვევაში გავაგრძელოთ
        })
      ).subscribe({
        next: (response) => {
          if (response) {
            console.log('Keep-alive ping sent successfully');
          }
        }
      });
    });
    
    console.log('Keep-alive service started');
  }

  stopKeepAlive() {
    if (this.keepAliveSubscription) {
      this.keepAliveSubscription.unsubscribe();
      this.keepAliveSubscription = undefined;
      console.log('Keep-alive service stopped');
    }
  }

  ngOnDestroy() {
    this.stopKeepAlive();
  }

  // მანუალური ping ფუნქცია
  ping() {
    return this.http.get(`${this.API_URL}/health`).pipe(
      catchError(err => {
        console.error('Manual ping failed:', err);
        return of(null);
      })
    );
  }
}