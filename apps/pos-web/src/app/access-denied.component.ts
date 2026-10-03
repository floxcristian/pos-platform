import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
@Component({
  selector: 'pos-access-denied',
  imports: [RouterLink, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="pos-panel p-8 max-w-xl mx-auto text-center">
    <i class="pi pi-lock text-3xl text-primary mb-4" aria-hidden="true"></i>
    <h1 class="text-2xl font-semibold mb-3">Acceso no disponible</h1>
    <p class="text-muted-color mb-6">
      Tu perfil no tiene permiso para esta sección o el módulo está deshabilitado. Puedes cambiar el perfil de
      demostración desde el menú de usuario.
    </p>
    <p-button
      ariaLabel="Volver al inicio"
      label="Volver al inicio"
      icon="pi pi-arrow-left"
      routerLink="/inicio"
    />
  </section>`,
})
export class AccessDeniedComponent {}
