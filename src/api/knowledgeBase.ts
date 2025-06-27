import request from './request';

//获取所有知识库
export function getKnowledgeBaseList(userName?: string) {
  const params = userName ? { userName } : {};
  return request.get('/api/auth/knowledgeBase/list', { params });
}

// 新增：新建知识库API
export function addKnowledgeBase(data: { name: string; owner: string; date: string; editors: string[] }) {
  return request.post('/api/auth/knowledgeBase/add', data);
}

// 新增：获取所有用户API
export function getAllUsers() {
  return request.get('/api/auth/user/all');
}

// 重命名知识库API
export function renameKnowledgeBase(oldName?: string, newName?: string) {
  return request.get('/api/auth/knowledgeBase/rename', { params: { oldName, newName } });
}

// 删除知识库API
export function deleteKnowledgeBase(name?: string) {
  return request.get('/api/auth/knowledgeBase/delete', { params: { name } });
}

// 条件查询知识库API
export function searchKnowledgeBase(params: { name?: string; owner?: string; startDate?: string; endDate?: string }) {
  return request.get('/api/auth/knowledgeBase/search', { params });
}
