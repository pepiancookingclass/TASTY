'use client';

import { useUserRoles } from './useUserRoles';

export function usePermissions() {
  const { roles, loading } = useUserRoles();

  // Permisos específicos por rol
  const permissions = {
    // CREADOR: Solo puede gestionar sus propios productos y ofertas
    canManageOwnProducts: roles.includes('creator') || roles.includes('admin') || roles.includes('agent'),
    canCreateOwnOffers: roles.includes('creator') || roles.includes('admin') || roles.includes('agent'),
    canViewOwnOrders: roles.includes('creator') || roles.includes('admin') || roles.includes('agent'),
    canViewOwnStats: roles.includes('creator') || roles.includes('admin') || roles.includes('agent'),
    
    // ADMIN/AGENT: Puede gestionar TODOS los creadores y sus productos
    canManageAllCreators: roles.includes('admin') || roles.includes('agent'),
    canManageAllProducts: roles.includes('admin') || roles.includes('agent'),
    canManageAllOffers: roles.includes('admin') || roles.includes('agent'),
    canViewAllOrders: roles.includes('admin') || roles.includes('agent'),
    canViewAllStats: roles.includes('admin') || roles.includes('agent'),
    canDeleteCreators: roles.includes('admin') || roles.includes('agent'),
    canCreateCreators: roles.includes('admin') || roles.includes('agent'),
    
    // ADMIN EXCLUSIVO: Permisos de sistema
    canManageUsers: roles.includes('admin'),
    canManageRoles: roles.includes('admin'),
    canAccessSystemSettings: roles.includes('admin'),
    
    // Acceso a paneles
    canAccessCreatorPanel: roles.includes('creator') || roles.includes('admin') || roles.includes('agent'),
    canAccessAdminPanel: roles.includes('admin') || roles.includes('agent'),
    
    // Roles específicos
    isCreator: roles.includes('creator'),
    isAdmin: roles.includes('admin'),
    isAgent: roles.includes('agent'),
    isCustomer: roles.includes('customer') || roles.length === 0
  };

  return {
    ...permissions,
    roles,
    loading,
    hasRole: (role: string) => roles.includes(role),
    hasAnyRole: (roleList: string[]) => roleList.some(role => roles.includes(role))
  };
}
