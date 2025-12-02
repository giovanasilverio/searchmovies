import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserInterface } from '../../interfaces/user-interface';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy{
  showLogoutModal: boolean=false;

  fraseAtual: string = '';

  user: UserInterface | null = null;

  dropdownAberto: boolean = false;

  private subscription: Subscription | undefined;



  constructor(
    private router: Router,
    private auth: AuthService,
    ) { }

  ngOnInit(){
    this.subscription = this.auth.getUserData().subscribe((user: UserInterface) =>{
      this.user = user;
    })
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  toggleDropdown() {
    this.dropdownAberto = !this.dropdownAberto;
  }

  navHome() {
    this.router.navigate(['/home']);
  }

  openLogoutModal() {
    this.showLogoutModal=true;
  }

  cancelLogout() {
    this.showLogoutModal=false;
  }

  confirmLogout() {
    this.auth.logout();
    console.log('Usuário deslogado.');
  }
}


