import '@angular/compiler';
import { DOCUMENT } from '@angular/common';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  it('follows system changes, respects explicit mode, and removes its shared listener', () => {
    const listeners = new Set<() => void>();
    const media = {
      matches: false,
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
    };
    const toggle = vi.fn();
    const injector = Injector.create({
      providers: [
        {
          provide: DOCUMENT,
          useValue: { defaultView: { matchMedia: () => media }, documentElement: { classList: { toggle } } },
        },
      ],
    });
    const theme = runInInjectionContext(injector, () => new ThemeService());
    const changeSystem = (dark: boolean): void => {
      media.matches = dark;
      listeners.forEach((listener) => listener());
    };
    expect(listeners.size).toBe(1);
    expect(theme.resolvedTheme()).toBe('light');
    changeSystem(true);
    expect(theme.dark()).toBe(true);
    expect(toggle).toHaveBeenLastCalledWith('p-dark', true);
    theme.setMode('light');
    changeSystem(false);
    changeSystem(true);
    expect(theme.dark()).toBe(false);
    expect(toggle).toHaveBeenLastCalledWith('p-dark', false);
    theme.setMode('system');
    expect(theme.dark()).toBe(true);
    injector.destroy();
    expect(listeners.size).toBe(0);
  });
});
