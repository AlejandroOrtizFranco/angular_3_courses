import { Injectable } from '@angular/core';
import {UserManager, User} from 'oidc-client';
import { Subject } from 'rxjs';
import { Constants } from '../constants';
import { CoreModule } from './core.module';

@Injectable({
  providedIn: CoreModule
})
export class AuthService {
  private _userManager: UserManager;
  private _user : User;
  private _loginChangedSubject = new Subject<boolean>();

  loginChanged = this._loginChangedSubject.asObservable(); //Es producido por el Subject

  constructor() { 
    const stsSettings = {
      authority: Constants.stsAuthority,
      client_id: Constants.clientId, //un identificador para uni la client-app con el client-conf en el STS
      redirect_uri: `${Constants.clientRoot}signin-callback`, //donde redigira cuando el signin se complete
      scope: 'openid profile projects-api', //primero el scope: openid, profile es opcional, el scope que esta asociado al projects API el backend de la app
      response_type: 'code', //para PKCE solo es code, id_token token si fuera implicit flow y hasta aqui llegaria la conf
      post_logout_redirect_uri: `${Constants.clientRoot}signout-callback`,

      //para usar Auth0
      /*metadata: {
        issuer:`${ Constants.stsAuthority}`,
        authorization_endpoint:`${ Constants.stsAuthority}authorize?audience=projects-api`, //se agrega = para que de te jwt mas largo
        jwks_uri:`${ Constants.stsAuthority}.well-known/jwks.json`,
        token_endpoint:`${ Constants.stsAuthority}oauth/token`,
        userinfo_endpoint:`${ Constants.stsAuthority}userinfo`,
        end_session_endpoint:`${ Constants.stsAuthority}v2/logout?client_id=${Constants.clientId}&returnTo=${encodeURI(Constants.clientRoot)}signout-callback`,
      }*/
    };
    this._userManager = new UserManager(stsSettings); //recibe un setting que es donde viene el sts
  }

  login(){
    return this._userManager.signinRedirect();
  }

  isLoggedIn(): Promise<boolean>{
    return this._userManager.getUser().then(user=>{
      const userCurrent = !!user && !user.expired;
      if(this._user !== user){
        this._loginChangedSubject.next(userCurrent);
      }
      this._user= user;
      return userCurrent;
    });
  }

  completeLogin(){
    return this._userManager.signinRedirectCallback().then(user => {
      this._user = user;
      this._loginChangedSubject.next(!!user && !user.expired);
      return user;
    })
  }

  logout(){
    this._userManager.signoutRedirect();
  }

  completeLogout(){
    this._user = null;
    return this._userManager.signoutRedirectCallback();
  }
}
