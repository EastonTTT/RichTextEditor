import request from './request';

// ai摘要
export function getAiSummary(documentContent: string) {
    return request({
        url: '/api/editor/summary',
        method: 'post',
        // 添加请求体，根据后端要求可能是 data 或 params
        data: {
            content: documentContent // 确保字段名和后端一致（content）
        },
        timeout: 100000, // 单独设置超时时间（毫秒）
    });
}
