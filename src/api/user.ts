// 处理本地账号登录、注册和资料持久化。
import { get, patch, post } from '@/request'
import { clearStoredUser, getStoredToken, getStoredUser, setStoredSession } from '@/utils/localStore'
import type { UserProfile } from '@/types/user'

interface AuthPayload {
  token: string
  user: UserProfile
}

function persistAuth(payload: AuthPayload): UserProfile {
  return setStoredSession(payload.user, payload.token)
}

export async function login(name: string, password: string): Promise<UserProfile> {
  const payload = await post<AuthPayload>('/auth/login', {
    name,
    password,
  })

  return persistAuth(payload)
}

export async function register(name: string, password: string): Promise<UserProfile> {
  const payload = await post<AuthPayload>('/auth/register', {
    name,
    password,
  })

  return persistAuth(payload)
}

export async function logout(): Promise<void> {
  clearStoredUser()
}

export async function getCurrentUser(): Promise<UserProfile> {
  const token = getStoredToken()
  if (!token) {
    return getStoredUser()
  }

  try {
    const user = await get<UserProfile>('/auth/me')
    setStoredSession(user, token)
    return user
  } catch {
    clearStoredUser()
    return getStoredUser()
  }
}

export function hasToken(): boolean {
  return Boolean(getStoredToken())
}

export async function getUserList(): Promise<UserProfile[]> {
  return get<UserProfile[]>('/users')
}

export async function updateCurrentUserProfile(payload: { nickname: string; avatar: string }): Promise<UserProfile> {
  const user = await patch<UserProfile>('/auth/user/profile', payload)
  const token = getStoredToken()

  if (token) {
    setStoredSession(user, token)
  }

  return user
}
