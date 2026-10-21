import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withHashLocation } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor, problemDetailsInterceptor } from './core/interceptors';
import { TranslatedTitleStrategy } from './core/title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Static hosting (GitHub Pages) cannot rewrite deep links, so demo mode uses hash URLs, as in the Vue app.
    provideRouter(routes, ...(environment.demoMode ? [withHashLocation()] : [])),
    provideHttpClient(withInterceptors([authInterceptor, problemDetailsInterceptor])),
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
  ],
};
