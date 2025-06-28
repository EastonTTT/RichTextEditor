import { useUserStore } from '@/stores/user';
import request from './request';

// 创建文档
export default function createdocument(data: {
    docName: string;
    kbId: number;
    userId: number;
    //content?: string 
    isCollaborative: boolean
}) {
    return request({
        url: '/api/document/create',
        method: 'post',
        data
    });
}

// 获取知识库下的文档列表
export function getDocumentsByKnowledgeBase(knowledgeBaseId: number) {
    return request({
        url: `/api/document/knowledge-base/${knowledgeBaseId}`,
        method: 'get'
    });
}

// 获取文档详情
export function getDocument(id: number) {
    return request({
        url: `/api/document/${id}`,
        method: 'get'
    });
}

// 更新文档访问时间
export function updateDocumentAccess(id: number) {
    return request({
        url: `/api/document/${id}/access`,
        method: 'put'
    });
}

//查询是否允许协作
export function getCollaborationStatus(id: number) {
    return request({
        url: `/api/document/${id}/collaboration-status`,
        method: 'get'
    });
}

// 保存文档内容
export function saveDocument(id: number | string, content: string) {
    return request({
        url: `/api/document/${id}/content`,
        method: 'post',
        data: {
            content
        }
    });
}

//开启/关闭文档协作
export function setDocumentCollaboration(id: number, isCollaborative: boolean) {
    return request({
        url: `/api/document/${id}/collaboration`,
        method: 'post',
        data: { isCollaborative }
    });
}

export function getDocumentByuserId(userId?: number) {
    if (userId == undefined) {
        return request({
            url: `/api/document/list`,
            method: 'get',
        })
    } else {
        return request({
            url: `/api/document/list/${userId}`,
            method: 'get',
        })
    }

}

// 删除文档
export function deleteDocument(name?: string) {
    return request({
        url: '/api/document/delete',
        method: 'post',
        params: { name }
    });
}

// 重命名文档
export function renameDocument(oldName?: string, newName?: string) {
    return request({
        url: '/api/document/rename',
        method: 'post',
        params: { oldName, newName }
    });
}
// 查询文档
export function searchDocument(docName = "", nickName = "", begin = "", end = "") {
    return request({
        url: '/api/document/search',
        method: 'post',
        params: { userId: useUserStore().userInfo.userId },
        data: {
            docName, nickName, begin, end
        }
    });
}