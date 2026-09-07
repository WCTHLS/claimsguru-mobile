import { RolePermissions, PermissionAction, MinimumRequiredRole } from './permissions';
import { useAuthStore } from '../../state/useAuthStore';

export const usePermission = () => {
  const role = useAuthStore(state => state.role);

  const can = (action: PermissionAction): boolean => {
    return RolePermissions[role].includes(action);
  };

  const getRequiredRole = (action: PermissionAction): string => {
    return MinimumRequiredRole[action];
  };

  return { role, can, getRequiredRole };
};
