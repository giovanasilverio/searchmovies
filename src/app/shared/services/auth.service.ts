import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of, switchMap } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { UserInterface } from '../interfaces/user-interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private auth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

cadastro(name: string, email: string, password: string, confirmPassword: string) {
  if (password !== confirmPassword) {
    alert('As senhas não coincidem.');
    return;
  }

  email = email.trim();

  // validação básica de e-mail
  if (!email) {
    alert('Informe um e-mail válido.');
    return;
  }

  // 1) Verificar se já existe algum login para esse email
  this.auth.fetchSignInMethodsForEmail(email)
    .then(async (methods) => {
      if (methods && methods.length > 0) {
        // já existe conta para esse e-mail
        alert('Já existe uma conta cadastrada com esse e-mail. Tente fazer login ou redefinir a senha.');
        return;
      }

      // 2) Se não existe, cria o usuário
      return this.auth.createUserWithEmailAndPassword(email, password);
    })
    .then(async (userCredential) => {
      // se o passo anterior foi interrompido por conta existente, cai aqui com undefined
      if (!userCredential) return;

      const user = userCredential.user;

      if (user) {
        // 3) Envia e-mail de verificação
        await user.sendEmailVerification();

        // 4) Salva dados extras no Firestore
        const userData: UserInterface = {
          name: name,
          email: email,
          tipo: 'Usuário'
        };

        await this.salvarDados(user.uid, userData);

        alert('Conta criada com sucesso! Verifique seu e-mail antes de fazer login.');
        this.router.navigate(['/login']);
      }
    })
    .catch((error) => {
      console.error(error);

      let msg = 'Erro ao criar conta.';

      if (error.code === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está em uso. Tente fazer login ou redefinir a senha.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'E-mail inválido.';
      } else if (error.code === 'auth/weak-password') {
        msg = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      } else if (error.message) {
        msg = error.message;
      }

      alert(msg);
    });
}

  salvarDados(id: string, user: UserInterface){
    return this.firestore.collection('users').doc(id).set(user);
  }

  login(email: string, password: string): Promise<void> {
  return this.auth.signInWithEmailAndPassword(email, password)
    .then(async cred => {
      const user = cred.user;

      if (!user) {
        throw new Error("Erro inesperado: usuário não encontrado.");
      }

      // 1) Verificar se o email foi verificado
      if (!user.emailVerified) {
        throw new Error("Seu e-mail ainda não foi verificado. Verifique sua caixa de entrada.");
      }
      // Se tudo OK → login válido
      this.router.navigate(['/home']);
    })
    .catch((err: any) => {
      console.error(err);

      // TRADUZIR ERROS DO FIREBASE:
      let msg = "Falha ao fazer login.";

      if (err.code === "auth/user-not-found") {
        msg = "Usuário não encontrado. Crie uma conta antes de entrar.";
      }
      else if (err.code === "auth/wrong-password") {
        msg = "Senha incorreta. Tente novamente.";
      }
      else if (err.code === "auth/invalid-email") {
        msg = "E-mail inválido.";
      }
      else if (err.message) {
        msg = err.message; // mensagens personalizadas acima (verificação de e-mail, etc.)
      }

      throw new Error(msg);
    });
  }


  async reenviarEmailVerificacao(email: string, password: string): Promise<void> {
  // limpa e-mail
  email = email.trim();

  if (!email || !password) {
    throw new Error('Informe e-mail e senha para reenviar o e-mail de verificação.');
  }

  try {
    // faz login silencioso só pra recuperar o user
    const cred = await this.auth.signInWithEmailAndPassword(email, password);
    const user = cred.user;

    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    if (user.emailVerified) {
      throw new Error('Este e-mail já foi verificado. Tente fazer login normalmente.');
    }

    await user.sendEmailVerification();
    await this.auth.signOut();

  } catch (err: any) {
    console.error(err);

    if (err.code === 'auth/user-not-found') {
      throw new Error('Usuário não encontrado. Verifique o e-mail digitado.');
    }
    if (err.code === 'auth/wrong-password') {
      throw new Error('Senha incorreta. Verifique os dados informados.');
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('E-mail inválido.');
    }

    // se for erro que eu mesmo lancei, reaproveita a mensagem
    if (err.message) {
      throw new Error(err.message);
    }

    throw new Error('Não foi possível reenviar o e-mail de verificação.');
  }
}


  async loginComGoogle(): Promise<firebase.User | null> {
    const provider = new firebase.auth.GoogleAuthProvider();

    // use compat direto (mesmo singleton do firebase-init)
    const cred = await firebase.auth().signInWithPopup(provider);

    if (cred.user) {
      const doc = this.firestore.collection('users').doc(cred.user.uid);
      const snap = await doc.ref.get();
      if (!snap.exists) {
        await this.salvarDados(cred.user.uid, {
          name: cred.user.displayName ?? '',
          email: cred.user.email ?? '',
          tipo: 'Usuário'
        });
      }
    }
    return cred.user;
  }

  async loginComGoogleRedirect() {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebase.auth().signInWithRedirect(provider);
  }

  async resolverRedirect() {
    return firebase.auth().getRedirectResult();
  }

  redefinirSenha(email: string) {
    this.auth.sendPasswordResetEmail(email).catch(console.error);
  }

  logout() {
    this.auth.signOut().then(() => this.router.navigate(['/'])).catch(console.error);
  }

  getUserData(): Observable<any> {
    return this.auth.authState.pipe(
      switchMap(user =>
        user ? this.firestore.collection('users').doc(user.uid).valueChanges() : of(null)
      )
    );
  }

}
