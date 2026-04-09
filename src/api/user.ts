// 处理本地账号登录、注册和资料持久化。
import { get, patch, post } from '@/request'
import { clearStoredUser, getStoredToken, getStoredUser, setStoredSession } from '@/utils/localStore'
import type { UserProfile } from '@/types/user'

interface AuthPayload {
  token: string
  user: UserProfile
}

function persistAuth(payload: AuthPayload): UserProfile {
  // 登录/注册成功后统一在这里落本地会话，避免两边重复写存储逻辑。
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
  // 当前项目的退出登录只需要清掉本地身份信息。
  clearStoredUser()
}

export async function getCurrentUser(): Promise<UserProfile> {
  // 优先用 token 向服务端校验用户；失败时退回本地默认用户，保证界面仍可渲染。
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
  // 更新成功后要同步刷新本地缓存，保证侧边栏和资料弹窗立即一致。
  const user = await patch<UserProfile>('/auth/user/profile', payload)
  const token = getStoredToken()

  if (token) {
    setStoredSession(user, token)
  }

  return user
}
