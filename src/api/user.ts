import request from './request';

// 用户登录
export function login(data: { phone: string; password: string }) {
    return request({
        url: '/api/auth/login',
        method: 'post',
        data  
    });
}

// 用户注册
export function register(data: { phone: string; password: string }) {
    return request({
        url: '/api/auth/register',
        method: 'post',
        data
    });
} 

//获取当前用户信息
export const getMyInfo = () => {
  return request({
    url: '/api/auth/info',
    method: 'get'
  })
}