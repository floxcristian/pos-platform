import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { civilDateToPicker, pickerDateToCivil } from './civil-date-time';

/** An empty end marks an in-progress range selection; null clears the range. */
export type CivilDateRange = readonly [start: string, end: string];

@Component({
  selector: 'pos-civil-date-range',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePickerModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CivilDateRangeComponent),
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
      selectionMode="range"
      placeholder="Desde — Hasta"
      dateFormat="dd/mm/yy"
      [readonlyInput]="true"
      [hideOnDateTimeSelect]="true"
      [showIcon]="true"
      iconDisplay="input"
      [showButtonBar]="true"
      appendTo="body"
      class="w-full"
      [fluid]="true"
      [pt]="{ pcInputText: { root: { 'aria-describedby': describedBy() } } }"
    />
  `,
})
export class CivilDateRangeComponent implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly ariaLabel = input<string>();
  readonly describedBy = input<string>();
  readonly invalid = input(false);
  readonly disabled = signal(false);
  private readonly value = signal<CivilDateRange | null>(null);
  readonly pickerValue = computed(() => {
    const range = this.value();
    const start = civilDateToPicker(range?.[0]);
    return start ? [start, civilDateToPicker(range?.[1])] : null;
  });

  private onChange: (value: CivilDateRange | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: CivilDateRange | null | undefined): void {
    this.value.set(value ?? null);
  }

  registerOnChange(callback: (value: CivilDateRange | null) => void): void {
    this.onChange = callback;
  }

  registerOnTouched(callback: () => void): void {
    this.onTouched = callback;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  changeValue(value: unknown): void {
    const start = Array.isArray(value) ? pickerDateToCivil(value[0]) : '';
    const end = Array.isArray(value) ? pickerDateToCivil(value[1]) : '';
    const range: CivilDateRange | null = start ? [start, end] : null;
    this.value.set(range);
    this.onChange(range);
  }

  markTouched(): void {
    this.onTouched();
  }
}
