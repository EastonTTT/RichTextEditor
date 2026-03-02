import { clearStoredUser, getStoredToken, getStoredUser, setStoredUser } from '@/utils/localStore'
import type { UserProfile } from '@/types/user'

export async function login(name: string): Promise<UserProfile> {
  return setStoredUser(name)
}

export async function logout(): Promise<void> {
  clearStoredUser()
}

export async function getCurrentUser(): Promise<UserProfile> {
  return getStoredUser()
}

export function hasToken(): boolean {
  return Boolean(getStoredToken())
}
