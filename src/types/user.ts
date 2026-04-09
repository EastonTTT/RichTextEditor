// 声明用户资料类型及显示名称辅助方法。
export interface UserProfile {
  id: string
  name: string
  color: string
  nickname?: string
  avatar?: string
}

export function getUserDisplayName(user: Pick<UserProfile, 'name' | 'nickname'>) {
  return user.nickname?.trim() || user.name
}
