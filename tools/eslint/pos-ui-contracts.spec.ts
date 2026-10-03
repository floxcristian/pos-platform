import { createRequire } from 'node:module';
import { ESLint, Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const plugin = require('./pos-ui-contracts.cjs');
const parser = require('@angular-eslint/template-parser');
const linter = new Linter();

function check(template: string, tooltips = false) {
  return linter.verify(
    template,
    [
      {
        files: ['**/*.html'],
        languageOptions: { parser },
        plugins: { 'pos-ui': plugin },
        rules: {
          'pos-ui/icon-button-tooltip': tooltips ? 'error' : 'off',
          'pos-ui/no-secondary-outlined-button': 'error',
          'pos-ui/no-labeled-secondary-text-button': 'error',
        },
      },
    ],
    { filename: 'contract.html' },
  );
}

describe('contratos de botones PrimeNG', () => {
  it.each([
    '<p-button icon="pi pi-search" ariaLabel="Buscar" />',
    '<p-button [icon]="icon()" [ariaLabel]="label()" />',
    '<button pButton aria-label="Cerrar"><i class="pi pi-times"></i></button>',
    '<button aria-label="Cerrar"><svg aria-hidden="true"></svg><span class="sr-only">Cerrar</span></button>',
  ])('impide iconos sin ayuda visible: %s', (template) => {
    expect(check(template, true).map((message) => message.ruleId)).toEqual(['pos-ui/icon-button-tooltip']);
  });

  it.each([
    '<p-button posTooltip icon="pi pi-search" ariaLabel="Buscar" />',
    '<button [posTooltip]="help()" aria-label="Cerrar"><svg></svg></button>',
    '<p-button icon="pi pi-plus" label="Crear" />',
    '<p-button icon="pi pi-plus" [label]="caption()" />',
    '<button><i class="pi pi-plus"></i> Crear</button>',
  ])('conserva tooltips y etiquetas visibles: %s', (template) => {
    expect(check(template, true)).toEqual([]);
  });
  // Loading the full ESLint/Nx graph is an integration check, including a cold CI workspace.
  it('analiza templates inline mediante la configuración real del repositorio', async () => {
    const source = `import { Component } from '@angular/core';
      @Component({template: '<p-button severity="secondary" label="Guardar" outlined />'})
      export class ExampleComponent {}`;
    const eslint = new ESLint();
    const [result] = await eslint.lintText(source, { filePath: 'libs/ui/src/lib/example.component.ts' });
    expect(
      result.messages
        .filter((message) => message.ruleId?.startsWith('pos-ui/'))
        .map((message) => message.ruleId),
    ).toEqual(['pos-ui/no-secondary-outlined-button']);
  }, 30000);

  it.each([
    '<p-button severity="secondary" label="Guardar" outlined />',
    '<p-button [severity]="\'secondary\'" label="Guardar" [outlined]="true" />',
    '<button pButton type="button" severity="secondary" outlined>Exportar</button>',
    '<a pButton href="/reportes" severity="secondary" variant="outlined">Reportes</a>',
    '<p-button severity="secondary" [variant]="\'outlined\'" icon="pi pi-plus" />',
  ])('impide secundarios outlined: %s', (template) => {
    expect(check(template).map((message) => message.ruleId)).toEqual(['pos-ui/no-secondary-outlined-button']);
  });

  it.each([
    '<p-button severity="secondary" label="Guardar" text />',
    '<p-button severity="secondary" [label]="caption()" [text]="true" />',
    '<button pButton type="button" severity="secondary" text><span pButtonLabel>Exportar</span></button>',
    '<a pButton href="/reportes" severity="secondary" variant="text">{{ caption() }}</a>',
    '<p-button severity="secondary" text>@if (ready()) { Guardar }</p-button>',
  ])('impide secundarios text con etiqueta: %s', (template) => {
    expect(check(template).map((message) => message.ruleId)).toEqual([
      'pos-ui/no-labeled-secondary-text-button',
    ]);
  });

  it.each([
    '<p-button severity="secondary" label="Guardar" />',
    '<p-button severity="secondary" [outlined]="false" label="Guardar" />',
    '<p-button severity="secondary" outlined="false" label="Guardar" />',
    '<p-button severity="secondary" [text]="false" label="Guardar" />',
    '<p-button severity="secondary" text icon="pi pi-search" ariaLabel="Buscar" />',
    '<button pButton type="button" severity="secondary" text aria-label="Buscar"><i class="pi pi-search"></i></button>',
    '<button pButton type="button" severity="secondary" text><i class="pi pi-search"></i><span class="sr-only">Buscar</span></button>',
    '<p-button severity="secondary" text [label]="\'\'" icon="pi pi-search" />',
    '<p-button severity="danger" label="Eliminar" outlined />',
    '<p-button label="Cancelar" class="p-button-tonal" />',
    '<button type="button" severity="secondary" outlined>Sin directiva PrimeNG</button>',
    '<p-button [severity]="state()" outlined label="Continuar" />',
    '<p-button severity="secondary" [outlined]="needsOutline()" label="Continuar" />',
  ])('conserva variantes válidas y evita inferir expresiones dinámicas: %s', (template) => {
    expect(check(template)).toEqual([]);
  });
});
