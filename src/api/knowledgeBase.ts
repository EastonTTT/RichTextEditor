import request from './request';

export function getKnowledgeBaseList(userName?: string) {
  const params = userName ? { userName } : {};
  return request.get('/api/auth/knowledgeBase/list', { params });
}

// 新增：新建知识库API
export function addKnowledgeBase(data: { name: string; owner: string; date: string; editors: string[] }) {
  return request.post('/api/auth/knowledgeBase/add', data);
}
