export function isSameUserId(a, b) {
  if (!a || !b) return false;
  const aStr = typeof a === 'string' ? a : a.toString();
  const bStr = typeof b === 'string' ? b : b.toString();
  return aStr === bStr;
}

export function ensureOwnerOrVendor(ownerUserId, vendorUserId, requesterUserId) {
  const owner = isSameUserId(ownerUserId, requesterUserId);
  const vendor = isSameUserId(vendorUserId, requesterUserId);
  return owner || vendor;
}
