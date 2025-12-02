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

  cadastro(name: string, email: string, password: string, confirmPassword: string){
    if(password !== confirmPassword){
      alert('As senhas não coincidem.');
      return;
    }

    this.auth.createUserWithEmailAndPassword(email, password).then(async userCredential =>{
      const user = userCredential?.user;

      if(user){
        const userData: UserInterface = {
          name: name,
          email: email,
          tipo: 'Usuário'
        }

        await this.salvarDados(user.uid,userData);
      }
    })
    .catch(error=>{
      console.log(error)
    })
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
