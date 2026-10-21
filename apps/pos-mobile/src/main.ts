import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent, createClientConfig } from '@pos-platform/client-shell';

bootstrapApplication(AppComponent, createClientConfig('mobile')).catch((error: unknown) =>
  console.error('No fue posible iniciar POS Platform móvil', error),
);
