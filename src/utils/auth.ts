export function isAdminRole(name) {
  // Should match the Admin "name" field, i.e. "app:<app_domain_name>:admin"
  return /^app:.*:admin$/.test(name);
}
