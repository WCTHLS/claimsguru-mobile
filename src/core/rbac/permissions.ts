export type UserRole = 'viewer' | 'submitter' | 'reviewer' | 'admin';

export type PermissionAction =
  | 'upload'
  | 'submit'
  | 'review'
  | 'index'
  | 'delete'
  | 'settings'
  | 'ops';

export const RolePermissions: Record<UserRole, PermissionAction[]> = {
  viewer: [],
  submitter: ['upload', 'submit'],
  reviewer: ['upload', 'submit', 'review', 'index'],
  admin: ['upload', 'submit', 'review', 'index', 'delete', 'settings', 'ops'],
};

export const MinimumRequiredRole: Record<PermissionAction, UserRole> = {
  upload: 'submitter',
  submit: 'submitter',
  review: 'reviewer',
  index: 'reviewer',
  delete: 'admin',
  settings: 'admin',
  ops: 'admin',
};

export const RoleDescriptions: Record<UserRole, string> = {
  viewer: 'Read-only: chat, search, and view. No upload, edit, submit, or delete.',
  submitter: 'Upload documents, start pipeline, and submit claims to payers.',
  reviewer: 'Submitter rights plus code feedback, field edits, re-run validation, and search indexing.',
  admin: 'Full system control, claim deletion, processing settings, and the Ops console.',
};
