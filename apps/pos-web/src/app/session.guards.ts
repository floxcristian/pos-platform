import { inject } from '@angular/core';
import { CanActivateChildFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { PosStore } from '@corporate-pos/data-access';

function requireSession(returnUrl: string): true | UrlTree {
  return (
    inject(PosStore).authenticated() ||
    inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl } })
  );
}

// Match the shell before resolving its permission-protected child routes.
export const sessionMatchGuard: CanMatchFn = (_route, segments) => {
  const router = inject(Router);
  const returnUrl =
    router.currentNavigation()?.extractedUrl.toString() ??
    `/${segments.map((segment) => segment.path).join('/')}`;
  return requireSession(returnUrl);
};

export const sessionChildGuard: CanActivateChildFn = (_route, state) => requireSession(state.url);

export const guestGuard: CanMatchFn = () =>
  !inject(PosStore).authenticated() || inject(Router).createUrlTree(['/inicio']);
