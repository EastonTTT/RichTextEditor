// 用户资料会同时用于鉴权、协同光标和页面展示。
export interface UserProfile {
  id: string
  name: string
  color: string
  nickname?: string
  avatar?: string
}

export function getUserDisplayName(user: Pick<UserProfile, 'name' | 'nickname'>) {
  // 昵称优先，未设置时回退到登录名。
  return user.nickname?.trim() || user.name
}
