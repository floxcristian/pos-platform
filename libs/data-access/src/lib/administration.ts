import {
  Branch,
  Customer,
  Offer,
  PosSettings,
  PosSnapshot,
  PosUser,
  PriceRule,
  Product,
  ReferenceItem,
  ReferenceKind,
  Result,
  ROLE_PERMISSIONS,
  failure,
  isValidRut,
  success,
  validMoney,
} from '@corporate-pos/domain';
import { TransactionContext } from './transactions';

export function saveCustomerRecord(
  state: PosSnapshot,
  input: Partial<Customer> & { name: string; rut: string },
  context: TransactionContext,
): Result<Customer> {
  if (input.name.trim().length < 3 || !isValidRut(input.rut))
    return failure('Ingresa un nombre y un RUT con dígito verificador válido.');
  const normalized = input.rut.replace(/[.\-\s]/g, '').toUpperCase();
  if (
    state.customers.some(
      (item) => item.id !== input.id && item.rut.replace(/[.\-\s]/g, '').toUpperCase() === normalized,
    )
  )
    return failure('Ya existe un cliente con ese RUT.');
  const current = state.customers.find((item) => item.id === input.id);
  const customer: Customer = {
    id: current?.id ?? context.id('customer'),
    name: input.name.trim(),
    rut: input.rut.trim().toUpperCase(),
    email: input.email?.trim() ?? current?.email ?? '',
    phone: input.phone?.trim() ?? current?.phone ?? '',
    address: input.address?.trim() ?? current?.address ?? '',
    city: input.city?.trim() ?? current?.city ?? '',
    business: input.business?.trim() ?? current?.business ?? '',
    creditLimit: input.creditLimit ?? current?.creditLimit ?? 0,
    creditUsed: current?.creditUsed ?? 0,
    creditTerms: input.creditTerms ?? current?.creditTerms ?? { installments: 1, periodDays: 30 },
    active: input.active ?? current?.active ?? true,
    updatedAt: context.now,
  };
  if (!validMoney(customer.creditLimit, true) || customer.creditLimit < customer.creditUsed)
    return failure('El cupo debe ser entero y no puede ser menor que el monto ya utilizado.');
  if (
    !Number.isInteger(customer.creditTerms.installments) ||
    customer.creditTerms.installments < 1 ||
    customer.creditTerms.installments > 36 ||
    !Number.isInteger(customer.creditTerms.periodDays) ||
    customer.creditTerms.periodDays < 1 ||
    customer.creditTerms.periodDays > 365
  )
    return failure('Las condiciones de crédito permiten 1–36 cuotas y 1–365 días entre vencimientos.');
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))
    return failure('El correo no tiene un formato válido.');
  if (current) state.customers = state.customers.map((item) => (item.id === current.id ? customer : item));
  else state.customers.unshift(customer);
  return success(customer);
}
export function saveProductRecord(
  state: PosSnapshot,
  input: Partial<Product> & { name: string; sku: string; price: number },
  context: TransactionContext,
): Result<Product> {
  if (input.name.trim().length < 3 || !input.sku.trim()) return failure('El producto necesita nombre y SKU.');
  if (!validMoney(input.price)) return failure('El precio debe ser un entero mayor a cero.');
  if (
    state.products.some(
      (item) => item.id !== input.id && item.sku.toUpperCase() === input.sku.trim().toUpperCase(),
    )
  )
    return failure('Ya existe un producto con ese SKU.');
  const current = state.products.find((item) => item.id === input.id);
  const product: Product = {
    id: current?.id ?? context.id('product'),
    sku: input.sku.trim().toUpperCase(),
    barcode: input.barcode?.trim() ?? current?.barcode ?? '',
    name: input.name.trim(),
    category: input.category?.trim() ?? current?.category ?? 'Sin categoría',
    brand: input.brand?.trim() ?? current?.brand ?? 'Sin marca',
    price: input.price,
    cost: input.cost ?? current?.cost ?? 0,
    stock: current?.stock ?? 0,
    unit: input.unit?.trim() ?? current?.unit ?? 'un',
    active: input.active ?? current?.active ?? true,
    taxRate: 19,
    updatedAt: context.now,
  };
  if (!validMoney(product.cost, true)) return failure('El costo debe ser un entero no negativo.');
  if (
    product.barcode &&
    state.products.some((item) => item.id !== input.id && item.barcode === product.barcode)
  )
    return failure('El código de barras ya pertenece a otro producto.');
  if (current) state.products = state.products.map((item) => (item.id === current.id ? product : item));
  else state.products.unshift(product);
  return success(product);
}
export function saveOfferRecord(
  state: PosSnapshot,
  input: Offer,
  context: TransactionContext,
): Result<Offer> {
  if (
    !input.name.trim() ||
    !input.productIds.length ||
    input.productIds.some((id) => !state.products.some((product) => product.id === id))
  )
    return failure('La oferta necesita nombre y productos válidos.');
  if (
    !Number.isFinite(input.discountPercent) ||
    input.discountPercent <= 0 ||
    input.discountPercent > state.settings.maxDiscountPercent
  )
    return failure(`La oferta permite hasta ${state.settings.maxDiscountPercent} % de descuento.`);
  if (
    !Number.isFinite(Date.parse(input.startsAt)) ||
    !Number.isFinite(Date.parse(input.endsAt)) ||
    Date.parse(input.endsAt) <= Date.parse(input.startsAt)
  )
    return failure('La fecha de término debe ser posterior al inicio.');
  const offer = {
    ...input,
    id: input.id || context.id('offer'),
    name: input.name.trim(),
    productIds: [...new Set(input.productIds)],
  };
  state.offers = [offer, ...state.offers.filter((item) => item.id !== offer.id)];
  return success(offer);
}
export function updateSettingsRecord(state: PosSnapshot, input: Partial<PosSettings>): Result<PosSettings> {
  const settings = { ...state.settings, ...input, currency: 'CLP' as const, taxRate: 19 as const };
  if (!settings.companyName.trim() || !isValidRut(settings.companyRut) || !settings.terminalId.trim())
    return failure('Completa empresa, RUT válido y código de caja.');
  if (
    !Number.isFinite(settings.maxDiscountPercent) ||
    settings.maxDiscountPercent < 0 ||
    settings.maxDiscountPercent > 100 ||
    !validMoney(settings.offlineLimit)
  )
    return failure('Revisa el descuento máximo y el límite de venta sin conexión.');
  if (!['light', 'dark', 'system'].includes(settings.theme)) return failure('El tema no es válido.');
  if (typeof settings.sidebarCollapsed !== 'boolean')
    return failure('La preferencia de navegación no es válida.');
  if (!state.branches.some((branch) => branch.id === settings.branchId && branch.active))
    return failure('La sucursal seleccionada no está activa.');
  if (settings.branchId !== state.settings.branchId && state.session?.status === 'open')
    return failure('Cierra el turno antes de cambiar de sucursal.');
  state.settings = settings;
  return success(settings);
}
export function saveUserRecord(
  state: PosSnapshot,
  input: PosUser,
  context: TransactionContext,
): Result<PosUser> {
  if (
    !input.name.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) ||
    !Object.hasOwn(ROLE_PERMISSIONS, input.role)
  )
    return failure('Completa nombre, correo y rol válido.');
  if (
    !input.branchIds.length ||
    input.branchIds.some((id) => !state.branches.some((branch) => branch.id === id && branch.active))
  )
    return failure('Asigna al menos una sucursal activa.');
  if (
    state.users.some((user) => user.id !== input.id && user.email.toLowerCase() === input.email.toLowerCase())
  )
    return failure('El correo ya pertenece a otro usuario.');
  const current = state.users.find((user) => user.id === input.id);
  if (
    current?.role === 'admin' &&
    current.active &&
    (!input.active || input.role !== 'admin') &&
    state.users.filter((user) => user.role === 'admin' && user.active).length === 1
  )
    return failure('Debe quedar al menos un administrador activo.');
  const user = {
    ...input,
    id: input.id || context.id('user'),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    branchIds: [...new Set(input.branchIds)],
  };
  state.users = [user, ...state.users.filter((item) => item.id !== user.id)];
  return success(user);
}
export function saveBranchRecord(
  state: PosSnapshot,
  input: Branch,
  context: TransactionContext,
): Result<Branch> {
  if (!input.name.trim() || !input.code.trim() || !input.city.trim() || !validMoney(input.terminals))
    return failure('Completa nombre, código, ciudad y número de cajas.');
  if (
    state.branches.some(
      (branch) => branch.id !== input.id && branch.code.toUpperCase() === input.code.toUpperCase(),
    )
  )
    return failure('Ya existe una sucursal con ese código.');
  if (input.id === state.settings.branchId && !input.active)
    return failure('No se puede desactivar la sucursal en uso.');
  const branch = {
    ...input,
    id: input.id || context.id('branch'),
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
  };
  state.branches = [branch, ...state.branches.filter((item) => item.id !== branch.id)];
  return success(branch);
}
export function saveReferenceRecord(
  state: PosSnapshot,
  kind: ReferenceKind,
  input: ReferenceItem,
  context: TransactionContext,
): Result<ReferenceItem> {
  if (!Object.hasOwn(state.referenceCatalogs, kind)) return failure('El catálogo no existe.');
  if (!input.name.trim() || !input.code.trim()) return failure('Completa nombre y código.');
  if (
    state.referenceCatalogs[kind].some(
      (item) => item.id !== input.id && item.code.toUpperCase() === input.code.toUpperCase(),
    )
  )
    return failure('Ya existe un registro con ese código.');
  const item = {
    ...input,
    id: input.id || context.id(kind),
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
  };
  state.referenceCatalogs[kind] = [
    item,
    ...state.referenceCatalogs[kind].filter((existing) => existing.id !== item.id),
  ];
  return success(item);
}

export function savePriceRuleRecord(
  state: PosSnapshot,
  input: PriceRule,
  context: TransactionContext,
): Result<PriceRule> {
  if (
    !input.name.trim() ||
    !state.products.some((product) => product.id === input.productId && product.active) ||
    (input.customerId &&
      !state.customers.some((customer) => customer.id === input.customerId && customer.active))
  )
    return failure('Selecciona un nombre, producto y cliente válidos.');
  if (!validMoney(input.minQuantity) || input.minQuantity > 9999 || !validMoney(input.unitPrice))
    return failure('La cantidad mínima y el precio deben ser enteros mayores a cero.');
  if (
    input.enabled &&
    state.priceRules.some(
      (rule) =>
        rule.id !== input.id &&
        rule.enabled &&
        rule.productId === input.productId &&
        rule.customerId === input.customerId &&
        rule.minQuantity === input.minQuantity,
    )
  )
    return failure('Ya existe una condición activa para ese producto, cliente y cantidad mínima.');
  const rule: PriceRule = { ...input, id: input.id || context.id('price-rule'), name: input.name.trim() };
  state.priceRules = [rule, ...state.priceRules.filter((item) => item.id !== rule.id)];
  return success(rule);
}
