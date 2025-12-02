import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {

    return this.afAuth.authState.pipe(
      take(1), // pega apenas o primeiro valor e completa
      map(user => {
        // se estiver logado E com e-mail verificado → permite acessar a Home
        if (user && user.emailVerified) {
          return true;
        }

        // se não estiver logado ou não verificou o e-mail → manda pra login
        return this.router.createUrlTree(
          ['/login'],
          { queryParams: { returnUrl: state.url } }
        );
      })
    );
  }
}
