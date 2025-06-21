import request from './request';

// 用户登录
export function login(data: { username: string; password: string }) {
    return request({
        url: '/api/auth/login',
        method: 'post',
        data
    });
}

// 用户注册
export function register(data: { username: string; password: string }) {
    return request({
        url: '/api/auth/register',
        method: 'post',
        data
    });
} 