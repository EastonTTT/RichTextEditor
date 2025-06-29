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

/**
 * 更新用户个人资料（昵称和头像）
 * @param data 包含要更新的用户名、昵称和头像
 */
export const updateUserProfile = (data: { username: string; nickname: string; avatar: string }) => {
    return request({
        url: '/api/auth/user/profile',
        method: 'put',
        data
    });
};

// 获取用户详细信息（后端未实现）
export const getUserInfo = (userId : number) => {
    return request({
        url: '/api/auth/user/getInfo',
        method: 'get',
        params: {
            userId
        }
    });
};

