import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Static hosting (GitHub Pages) cannot rewrite deep links, so demo mode uses hash URLs, as in the Vue app.
    provideRouter(routes, ...(environment.demoMode ? [withHashLocation()] : [])),
    provideHttpClient(),
  ],
};
