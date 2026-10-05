import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DEMO_PASSWORD, PosStore } from '@corporate-pos/data-access';
import { PosUser, ROLE_LABELS } from '@corporate-pos/domain';
import { DuotoneIconComponent, PosTooltipDirective } from '@corporate-pos/ui';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { LOGIN_PANELS } from './login-panels';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'pos-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    DuotoneIconComponent,
    PosTooltipDirective,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  host: { class: 'login-page' },
})
export class LoginComponent {
  readonly store = inject(PosStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  readonly panels = LOGIN_PANELS;
  readonly duplicates = [0, 1];
  readonly roleLabels = ROLE_LABELS;
  readonly demoPassword = DEMO_PASSWORD;
  readonly demoUsers = computed(() => this.store.snapshot().users.filter((user) => user.active));
  readonly email = signal('');
  readonly password = signal('');
  readonly remember = signal(false);
  readonly passwordVisible = signal(false);
  readonly emailTouched = signal(false);
  readonly passwordTouched = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly paused = signal(false);
  readonly helpVisible = signal(false);
  readonly emailInvalid = computed(() => this.emailTouched() && !EMAIL_PATTERN.test(this.email().trim()));
  readonly passwordInvalid = computed(() => this.passwordTouched() && !this.password());
  readonly emailError = computed(() =>
    this.email().trim() ? 'Ingresa un correo electrónico válido.' : 'Ingresa tu correo electrónico.',
  );

  fillDemo(user: PosUser): void {
    if (this.submitting()) return;
    this.email.set(user.email);
    this.password.set(DEMO_PASSWORD);
    this.emailTouched.set(false);
    this.passwordTouched.set(false);
    this.submitError.set('');
    this.passwordVisible.set(false);
    this.document.getElementById('login-submit')?.focus();
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    this.emailTouched.set(true);
    this.passwordTouched.set(true);
    this.submitError.set('');
    if (this.emailInvalid() || this.passwordInvalid()) {
      this.document.getElementById(this.emailInvalid() ? 'login-email' : 'login-password')?.focus();
      return;
    }
    this.submitting.set(true);
    try {
      const result = this.store.login(this.email().trim(), this.password(), this.remember());
      if (!result.ok) {
        this.submitError.set(result.error);
        return;
      }
      const navigated = await this.router.navigateByUrl(this.returnUrl(), { replaceUrl: true });
      if (!navigated) this.submitError.set('No pudimos abrir tu espacio. Intenta ingresar nuevamente.');
    } catch {
      this.submitError.set('No pudimos completar el acceso. Intenta nuevamente.');
    } finally {
      this.submitting.set(false);
    }
  }

  private returnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl');
    if (!value || !value.startsWith('/') || /^\/\//.test(value)) return '/';
    // Validate the decoded path, preserving encoded search parameters in the
    // original destination for Angular's internal router.
    let path: string;
    try {
      path = decodeURIComponent(value.split(/[?#]/, 1)[0]);
    } catch {
      return '/';
    }
    const unsafePath =
      !path.startsWith('/') ||
      path.startsWith('//') ||
      path.includes('\\') ||
      path.includes('%') ||
      Array.from(path).some(
        (character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
      ) ||
      /^\/login(?:[/?#;]|$)/i.test(path);
    if (unsafePath) return '/';
    return value;
  }
}
