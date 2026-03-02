import type {
  CreateDocumentPayload,
  DocumentDetail,
  DocumentSummary,
  UpdateDocumentPayload,
} from '@/types/document'
import {
  createDocument as createLocalDocument,
  deleteDocument as deleteLocalDocument,
  getDocumentById as getLocalDocumentById,
  listDocuments,
  updateDocument as updateLocalDocument,
} from '@/utils/localStore'

export async function getDocumentList(): Promise<DocumentSummary[]> {
  return listDocuments()
}

export async function getDocumentDetail(id: string): Promise<DocumentDetail | null> {
  return getLocalDocumentById(id)
}

export async function createDocument(payload: CreateDocumentPayload): Promise<DocumentDetail> {
  return createLocalDocument(payload)
}

export async function saveDocument(id: string, payload: UpdateDocumentPayload): Promise<DocumentDetail> {
  return updateLocalDocument(id, payload)
}

export async function removeDocument(id: string): Promise<void> {
  deleteLocalDocument(id)
}
