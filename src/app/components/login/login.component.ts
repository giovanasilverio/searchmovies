import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  carregando = false;
  erro: string | null = null;

  constructor(private router: Router, private auth: AuthService) {}

  cadastrar() {
    this.router.navigate(['/cadastro']);
  }

  async login() {
    if (!this.email || !this.password) {
      alert('Por favor, preencha todos os campos.');
      return;
  }

    this.erro = null;
    this.carregando = true;

    try {
      await this.auth.login(this.email, this.password);
    } catch (e: any) {
      this.erro = e?.message ?? "Erro ao fazer login.";
    } finally {
      this.carregando = false;
    }
  }

  async entrarComGoogle() {
    this.erro = null;
    this.carregando = true;
    try {
      await this.auth.loginComGoogle();
      this.router.navigate(['/home']);
    } catch (e: any) {
      console.error(e);
      this.erro = e?.message ?? 'Falha ao entrar com Google';
    } finally {
      this.carregando = false;
    }
  }
}
