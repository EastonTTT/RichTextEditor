/**
 * 用户状态管理Store
 *
 * 用于管理用户的登录状态、用户信息等全局状态
 *
 * @input 用户登录信息、用户信息更新
 * @process 1. 保存用户登录状态到localStorage
 *          2. 管理用户信息的增删改查
 *          3. 提供登录状态检查方法
 * @output 用户状态、登录状态、用户信息
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * 用户信息接口
 *
 * @interface UserInfo
 * @property {number} userId - 用户ID
 * @property {string} username - 用户登录名
 * @property {string} nickname - 用户昵称
 * @property {string} avatar - 用户头像
 * @property {boolean} isLoggedIn - 登录状态
 */
interface UserInfo {
  userId: number
  username: string
  nickname: string
  avatar: string
  isLoggedIn: boolean
}

export const useUserStore = defineStore('user', () => {
  // 用户信息状态
  const userInfo = ref<UserInfo>({
    userId: 0,
    username: '',
    nickname: '',
    avatar: '',
    isLoggedIn: false
  })

  // 计算属性：是否为游客（未登录）
  const isGuest = computed(() => !userInfo.value.isLoggedIn || !userInfo.value.username)

  /**
   * 初始化用户状态
   * 从localStorage中恢复用户登录状态
   */
  function initUserState() {
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      try {
        const parsed = JSON.parse(savedUserInfo)
        userInfo.value = { ...userInfo.value, ...parsed }
      } catch (error) {
        console.error('解析用户信息失败:', error)
        clearUserInfo()
      }
    }
  }

  /**
   * 设置用户登录信息
   *
   * @input {string} username - 用户名
   * @input {string} avatar - 用户头像（可选）
   * @process 1. 更新用户信息
   *          2. 设置登录状态为true
   *          3. 保存到localStorage
   * @output 无
   */
  function setUserLogin(data: { userId: number; username: string; nickname?: string; avatar?: string }) {
    userInfo.value = {
      userId: data.userId,
      username: data.username,
      nickname: data.nickname || data.username, // 如果没有昵称，默认使用用户名
      avatar: data.avatar || '',
      isLoggedIn: true
    }
    saveToLocalStorage()
  }

  /**
   * 更新用户信息
   *
   * @input {string} nickname - 新昵称
   * @input {string} avatar - 新头像
   * @process 1. 更新用户信息
   *          2. 保存到localStorage
   * @output 无
   */
  function updateUserInfo(data: { nickname: string; avatar: string }) {
    userInfo.value.nickname = data.nickname
    userInfo.value.avatar = data.avatar
    saveToLocalStorage()
  }

  /**
   * 退出登录
   *
   * @input 无
   * @process 1. 清除用户信息
   *          2. 清除localStorage
   *          3. 重置登录状态
   * @output 无
   */
  function logout() {
    userInfo.value = {
      userId: 0,
      username: '',
      nickname: '',
      avatar: '',
      isLoggedIn: false
    }
    localStorage.removeItem('userInfo')
  }

  /**
   * 清除用户信息
   *
   * @input 无
   * @process 清除localStorage中的用户信息
   * @output 无
   */
  function clearUserInfo() {
    localStorage.removeItem('userInfo')
  }

  /**
   * 保存用户信息到localStorage
   *
   * @input 无
   * @process 将当前用户信息序列化并保存到localStorage
   * @output 无
   */
  function saveToLocalStorage() {
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  return {
    userInfo,
    isGuest,
    initUserState,
    setUserLogin,
    updateUserInfo,
    logout,
    clearUserInfo
  }
})
