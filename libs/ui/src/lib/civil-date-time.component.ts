import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import {
  civilDateToPicker,
  civilTimeToPicker,
  pickerDateToCivil,
  pickerTimeToCivil,
} from './civil-date-time';

@Component({
  selector: 'pos-civil-date-time',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePickerModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CivilDateTimeComponent),
      multi: true,
    },
  ],
  host: { class: 'block min-w-0' },
  template: `
    <p-datepicker
      [inputId]="inputId()"
      [ariaLabel]="ariaLabel()"
      [ngModel]="pickerValue()"
      (ngModelChange)="changeValue($event)"
      [ngModelOptions]="{ standalone: true }"
      (onBlur)="markTouched()"
      [disabled]="disabled()"
      [invalid]="invalid()"
      [timeOnly]="mode() === 'time'"
      [placeholder]="mode() === 'time' ? 'HH:mm' : 'dd/mm/aaaa'"
      dateFormat="dd/mm/yy"
      hourFormat="24"
      [showIcon]="true"
      iconDisplay="input"
      [showButtonBar]="mode() === 'date'"
      appendTo="body"
      class="w-full"
      [fluid]="true"
      [pt]="{ pcInputText: { root: { 'aria-describedby': describedBy() } } }"
    />
  `,
})
export class CivilDateTimeComponent implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly ariaLabel = input<string>();
  readonly describedBy = input<string>();
  readonly invalid = input(false);
  readonly mode = input<'date' | 'time'>('date');
  readonly disabled = signal(false);
  private readonly value = signal('');
  readonly pickerValue = computed(() =>
    this.mode() === 'time' ? civilTimeToPicker(this.value()) : civilDateToPicker(this.value()),
  );

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? '');
  }

  registerOnChange(callback: (value: string) => void): void {
    this.onChange = callback;
  }

  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  changeValue(value: unknown): void {
    const civil = this.mode() === 'time' ? pickerTimeToCivil(value) : pickerDateToCivil(value);
    this.value.set(civil);
    this.onChange(civil);
  }

  markTouched(): void {
    this.onTouched();
  }
}
