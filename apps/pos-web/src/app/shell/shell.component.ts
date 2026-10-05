import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PosStore } from '@corporate-pos/data-access';
import type { Role } from '@corporate-pos/domain';
import {
  PosTooltipDirective,
  dateTime,
  EmptyStateComponent,
  StatusTagComponent,
  ThemeService,
  type ThemeMode,
} from '@corporate-pos/ui';
import { NAV_GROUPS, NavItem } from './navigation';

interface SearchResult {
  label: string;
  detail: string;
  icon: string;
  route: string;
  query?: string;
}
@Component({
  selector: 'pos-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onShortcut($event)' },
  imports: [
    PosTooltipDirective,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    ButtonModule,
    DialogModule,
    DrawerModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    StatusTagComponent,
    EmptyStateComponent,
  ],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  readonly store = inject(PosStore);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly theme = inject(ThemeService);
  readonly sidebarCollapsed = computed(() => this.store.snapshot().settings.sidebarCollapsed);
  readonly mobileOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly query = signal('');
  readonly dark = this.theme.dark;
  readonly themes: { label: string; value: ThemeMode }[] = [
    { label: 'Claro', value: 'light' },
    { label: 'Oscuro', value: 'dark' },
    { label: 'Sistema', value: 'system' },
  ];
  readonly currentUrl = signal(this.router.url);
  readonly searchInputId = 'global-search-input';
  readonly roles: { label: string; value: Role }[] = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'Cajero', value: 'cashier' },
    { label: 'Auditor', value: 'auditor' },
  ];
  readonly groups = computed(() =>
    NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => this.isAllowed(item)),
    })).filter((group) => group.items.length),
  );
  readonly activeItem = computed(() =>
    NAV_GROUPS.flatMap((group) => group.items).find((item) => this.currentUrl().split('?')[0] === item.route),
  );
  readonly activeGroup = computed(
    () =>
      NAV_GROUPS.find((group) => group.items.some((item) => item.route === this.currentUrl().split('?')[0]))
        ?.label ?? 'Inicio',
  );
  readonly branch = computed(() =>
    this.store.snapshot().branches.find((branch) => branch.id === this.store.snapshot().settings.branchId),
  );
  readonly roleLabel = computed(
    () => this.roles.find((role) => role.value === this.store.snapshot().role)?.label ?? 'Usuario',
  );
  readonly notifications = computed(() =>
    this.store
      .snapshot()
      .logs.filter((log) => log.level !== 'info')
      .slice(0, 20),
  );
  readonly searchResults = computed<SearchResult[]>(() => {
    const text = this.query().trim().toLocaleLowerCase('es');
    const nav = this.groups()
      .flatMap((group) => group.items)
      .filter(
        (item) => !text || `${item.label} ${item.keywords ?? ''}`.toLocaleLowerCase('es').includes(text),
      )
      .map((item) => ({ label: item.label, detail: 'Ir al módulo', icon: item.icon, route: item.route }));
    if (text.length < 2) return nav.slice(0, 8);
    const snapshot = this.store.snapshot();
    const records: SearchResult[] = [];
    if (this.store.can('masters', 'masters')) {
      records.push(
        ...snapshot.products
          .filter((product) =>
            `${product.name} ${product.sku} ${product.barcode}`.toLocaleLowerCase('es').includes(text),
          )
          .slice(0, 4)
          .map((product) => ({
            label: product.name,
            detail: `Producto · ${product.sku}`,
            icon: 'pos-icon-cube',
            route: '/maestros',
            query: product.sku,
          })),
      );
      records.push(
        ...snapshot.customers
          .filter((customer) => `${customer.name} ${customer.rut}`.toLocaleLowerCase('es').includes(text))
          .slice(0, 4)
          .map((customer) => ({
            label: customer.name,
            detail: `Cliente · ${customer.rut}`,
            icon: 'pos-icon-user',
            route: '/maestros',
            query: customer.rut,
          })),
      );
    }
    if (this.store.can('sell', 'sales'))
      records.push(
        ...snapshot.sales
          .filter((sale) => `${sale.number} ${sale.customerName}`.toLocaleLowerCase('es').includes(text))
          .slice(0, 4)
          .map((sale) => ({
            label: sale.number,
            detail: sale.customerName,
            icon: 'pos-icon-file',
            route: '/documentos',
            query: sale.number,
          })),
      );
    return [...nav, ...records].slice(0, 12);
  });
  readonly dateTime = dateTime;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
        this.mobileOpen.set(false);
        requestAnimationFrame(() => this.document.getElementById('main-content')?.scrollTo({ top: 0 }));
      }
    });
    effect(() => {
      this.theme.setMode(this.store.snapshot().settings.theme);
    });
    effect(() => {
      const item = this.activeItem();
      if (item && !this.isAllowed(item)) void this.router.navigate(['/inicio']);
    });
  }
  isAllowed(item: NavItem): boolean {
    return !item.permission || this.store.can(item.permission, item.module);
  }
  openSearch(): void {
    this.query.set('');
    this.searchOpen.set(true);
  }
  focusSearch(): void {
    this.document.getElementById(this.searchInputId)?.focus();
  }
  skipToContent(event: Event): void {
    event.preventDefault();
    this.document.getElementById('main-content')?.focus();
  }
  goTo(result: SearchResult): void {
    this.searchOpen.set(false);
    void this.router.navigate([result.route], { queryParams: result.query ? { buscar: result.query } : {} });
  }
  changeRole(role: Role): void {
    this.store.switchRole(role);
    this.profileOpen.set(false);
    if (this.activeItem() && !this.isAllowed(this.activeItem()!)) void this.router.navigate(['/inicio']);
  }
  toggleConnection(online: boolean): void {
    this.store.setOnline(online);
  }
  toggleTheme(): void {
    this.store.setTheme(this.dark() ? 'light' : 'dark');
  }
  toggleSidebar(): void {
    this.store.setSidebarCollapsed(!this.sidebarCollapsed());
  }
  changeTheme(mode: ThemeMode): void {
    this.store.setTheme(mode);
  }
  onShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }
}
