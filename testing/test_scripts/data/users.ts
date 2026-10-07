/** Test data — tài khoản và mã PIN dùng trong test RBAC / Void */
export const USERS = {
  MANAGER: { role: 'manager', pin: '9999' },
  WAITER:  { role: 'waiter',  pin: '' },
  GUEST:   { role: 'guest',   pin: '' },
} as const;

export const WRONG_PIN = '0000';
