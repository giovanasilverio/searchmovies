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

  mostrarReenviar = false; 

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
  this.mostrarReenviar = false;

  try {
    await this.auth.login(this.email, this.password);
  } catch (e: any) {
    this.erro = e?.message ?? "Erro ao fazer login.";

    // se for erro de e-mail não verificado, mostra o botão de reenviar
    if (this.erro?.includes('ainda não foi verificado')) {
      this.mostrarReenviar = true;
    }
  } finally {
    this.carregando = false;
  }
}

async reenviarVerificacao() {
  if (!this.email || !this.password) {
    alert('Informe e-mail e senha para reenviar o e-mail de verificação.');
    return;
  }

  this.carregando = true;
  this.erro = null;

  try {
    await this.auth.reenviarEmailVerificacao(this.email, this.password);
    alert('E-mail de verificação reenviado! Verifique sua caixa de entrada (e o spam).');
    this.mostrarReenviar = false;
  } catch (e: any) {
    console.error(e);
    this.erro = e?.message ?? 'Não foi possível reenviar o e-mail de verificação.';
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
