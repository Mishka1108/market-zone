import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./navbar/navbar.component";
import { FooterComponent } from "./footer/footer.component";
import { KeepAliveService } from './services/keep-alive.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'MarketZone';
  constructor(private keepAliveService: KeepAliveService) {}
  ngOnInit(): void {
    this.keepAliveService.startKeepAlive();
  }
}
