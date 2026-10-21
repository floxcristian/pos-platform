function propertyName(node) {
  if (!node.computed && node.property.type === 'Identifier') return node.property.name;
  return node.property.type === 'Literal' ? node.property.value : undefined;
}

function rootIdentifier(node) {
  if (node.type === 'MemberExpression') return rootIdentifier(node.object);
  if (node.type === 'CallExpression') return rootIdentifier(node.callee);
  return node.type === 'Identifier' ? node.name : undefined;
}

module.exports = {
  rules: {
    'no-focused-or-skipped-tests': {
      meta: {
        type: 'problem',
        schema: [],
        messages: {
          incompleteSuite: 'Do not commit focused or skipped tests; keep every test in the verification run.',
        },
      },
      create(context) {
        const testBindings = new Set();
        return {
          ImportDeclaration(node) {
            if (node.source.value !== 'vitest') return;
            for (const specifier of node.specifiers) {
              if (
                specifier.type === 'ImportNamespaceSpecifier' ||
                (specifier.type === 'ImportSpecifier' &&
                  ['describe', 'suite', 'it', 'test'].includes(specifier.imported.name))
              ) {
                testBindings.add(specifier.local.name);
              }
            }
          },
          MemberExpression(node) {
            if (
              ['only', 'skip'].includes(propertyName(node)) &&
              testBindings.has(rootIdentifier(node.object))
            ) {
              context.report({ node, messageId: 'incompleteSuite' });
            }
          },
        };
      },
    },
  },
};
