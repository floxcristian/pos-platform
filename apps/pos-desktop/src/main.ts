import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent, createClientConfig } from '@pos-platform/client-shell';

bootstrapApplication(AppComponent, createClientConfig('desktop')).catch((error: unknown) =>
  console.error('No fue posible iniciar Corporate POS', error),
);
