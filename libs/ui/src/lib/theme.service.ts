import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly systemColorScheme = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
  private readonly selectedMode = signal<ThemeMode>('system');
  private readonly resolved = signal<'light' | 'dark'>('light');
  readonly mode = this.selectedMode.asReadonly();
  readonly resolvedTheme = this.resolved.asReadonly();
  readonly dark = computed(() => this.resolved() === 'dark');

  constructor() {
    const updateSystemTheme = (): void => this.applyTheme();
    this.systemColorScheme?.addEventListener('change', updateSystemTheme);
    this.destroyRef.onDestroy(() => this.systemColorScheme?.removeEventListener('change', updateSystemTheme));
    this.applyTheme();
  }

  setMode(mode: ThemeMode): void {
    this.selectedMode.set(mode);
    this.applyTheme();
  }

  private applyTheme(): void {
    const dark = this.mode() === 'dark' || (this.mode() === 'system' && !!this.systemColorScheme?.matches);
    // Apply tokens before notifying chart consumers that read computed CSS values.
    this.document.documentElement.classList.toggle('p-dark', dark);
    this.resolved.set(dark ? 'dark' : 'light');
  }
}
