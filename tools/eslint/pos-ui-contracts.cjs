const { getTemplateParserServices } = require('@angular-eslint/utils');
const { LiteralPrimitive } = require('@angular-eslint/bundled-angular-compiler');

const unknown = Symbol('dynamic template expression');

function attribute(element, name) {
  const text = element.attributes.find((item) => item.name === name);
  if (text) return { node: text, value: text.value };
  const bound = element.inputs.find((item) => item.name === name);
  if (!bound) return null;
  const expression = bound.value.ast;
  return {
    node: bound,
    value: expression instanceof LiteralPrimitive ? expression.value : unknown,
  };
}

function isPrimeButton(element) {
  return (
    element.name === 'p-button' ||
    (['button', 'a'].includes(element.name) &&
      [...element.attributes, ...element.inputs].some((item) => item.name.toLowerCase() === 'pbutton'))
  );
}

function variant(element, name) {
  const named = attribute(element, 'variant');
  if (named?.value === name) return named.node;
  const flag = attribute(element, name);
  return flag && ['', true, 'true'].includes(flag.value) ? flag.node : null;
}

function projectedText(node) {
  if (['i', 'svg'].includes(node.name)) return false;
  const classes = node.attributes?.find((item) => item.name === 'class')?.value ?? '';
  if (classes.split(/\s+/).includes('sr-only')) return false;
  if (typeof node.value === 'string') return node.value.trim().length > 0;
  if (node.type === 'BoundText') return true;
  return [...(node.children ?? []), ...(node.branches ?? [])].some(projectedText);
}

function hasLabel(element) {
  const label = attribute(element, 'label');
  if (label?.value === unknown) return true;
  if (typeof label?.value === 'string' && label.value.trim()) return true;
  return element.children.some(projectedText);
}

function rule(kind, message) {
  return {
    meta: {
      type: 'suggestion',
      docs: { description: message },
      schema: [],
      messages: { inconsistentVariant: message },
    },
    create(context) {
      const services = getTemplateParserServices(context);
      return {
        Element(element) {
          if (!isPrimeButton(element) || attribute(element, 'severity')?.value !== 'secondary') return;
          const trigger = variant(element, kind);
          if (!trigger || (kind === 'text' && !hasLabel(element))) return;
          context.report({
            loc: services.convertNodeSourceSpanToLoc(trigger.sourceSpan),
            messageId: 'inconsistentVariant',
          });
        },
      };
    },
  };
}

module.exports = {
  rules: {
    'no-secondary-outlined-button': rule(
      'outlined',
      'Las acciones secundarias usan relleno gris; elimina outlined en este botón secondary.',
    ),
    'no-labeled-secondary-text-button': rule(
      'text',
      'Las acciones secundarias con etiqueta visible usan relleno gris; text se reserva para icon-only.',
    ),
  },
};
