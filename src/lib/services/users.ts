import { supabase } from '@/lib/supabase';
import { Creator } from '@/lib/types';

// Tipo para perfil de usuario
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profilePictureUrl?: string;
  roles: string[];
  skills?: ('pastry' | 'savory' | 'handmade')[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

// Transformar datos de Supabase a UserProfile
function transformUserProfile(data: any): UserProfile {
  return {
    id: data.id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone,
    profilePictureUrl: data.profile_picture_url,
    roles: data.roles || ['customer'],
    skills: data.skills,
    address: {
      street: data.address_street,
      city: data.address_city,
      state: data.address_state,
      zip: data.address_zip,
      country: data.address_country,
    },
  };
}

// Transformar a Creator
function transformToCreator(data: any): Creator {
  return {
    id: data.id,
    name: data.name || '',
    email: data.email || '',
    profilePictureUrl: data.profile_picture_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    imageHint: 'creator portrait',
    gender: data.gender || 'female',
    skills: data.skills || [],
    hasDelivery: data.has_delivery || false,
    availabilityStatus: data.availability_status || 'available',
    addressCity: data.address_city || '',
    addressState: data.address_state || '',
  };
}

// Obtener perfil de usuario por ID
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return transformUserProfile(data);
}

// Actualizar perfil de usuario
export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
  const updateData: any = {};

  if (profile.name) updateData.name = profile.name;
  if (profile.email) updateData.email = profile.email;
  if (profile.phone) updateData.phone = profile.phone;
  if (profile.profilePictureUrl) updateData.profile_picture_url = profile.profilePictureUrl;
  if (profile.roles) updateData.roles = profile.roles;
  if (profile.skills) updateData.skills = profile.skills;
  if (profile.address) {
    if (profile.address.street) updateData.address_street = profile.address.street;
    if (profile.address.city) updateData.address_city = profile.address.city;
    if (profile.address.state) updateData.address_state = profile.address.state;
    if (profile.address.zip) updateData.address_zip = profile.address.zip;
    if (profile.address.country) updateData.address_country = profile.address.country;
  }

  const { data, error } = await supabase
    .from('users')
    .upsert({ id: userId, ...updateData })
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }

  return transformUserProfile(data);
}

// Obtener roles de usuario
export async function getUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('users')
    .select('roles')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  return data?.roles || [];
}

// Agregar rol a usuario
export async function addUserRole(userId: string, role: string): Promise<boolean> {
  // Primero obtenemos los roles actuales
  const currentRoles = await getUserRoles(userId);
  
  if (currentRoles.includes(role)) {
    return true; // Ya tiene el rol
  }

  const { error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      roles: [...currentRoles, role],
    });

  if (error) {
    console.error('Error adding user role:', error);
    return false;
  }

  return true;
}

// Obtener todos los creadores (usuarios con rol 'creator')
export async function getCreators(): Promise<Creator[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .contains('roles', ['creator']);

  if (error) {
    console.error('Error fetching creators:', error);
    return [];
  }

  return data.map(transformToCreator);
}

// Obtener un creador por ID
export async function getCreatorById(creatorId: string): Promise<Creator | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', creatorId)
    .single();

  if (error) {
    console.error('Error fetching creator:', error);
    return null;
  }

  return transformToCreator(data);
}

