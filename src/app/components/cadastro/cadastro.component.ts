import { Component } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss'
})

export class CadastroComponent {

  name: string = '';
  email: string ='';
  password: string = '';
  confirmPassword: string = '';

  constructor(private auth: AuthService) { }

  validateForm(): boolean {
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      alert('Por favor, preencha todos os campos.');
      return false;
    }

    return true;
  }

  cadastrar(): void {
    if (this.validateForm()) {
      this.auth.cadastro(this.name, this.email, this.password, this.confirmPassword);
    }
  }

}