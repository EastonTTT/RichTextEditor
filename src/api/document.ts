import type {
  CreateDocumentPayload,
  DocumentDetail,
  DocumentSummary,
  DuplicateDocumentPayload,
  RecentDocumentItem,
  UpdateDocumentPayload,
} from '@/types/document'
import {
  createDocument as createLocalDocument,
  deleteDocument as deleteLocalDocument,
  duplicateDocument as duplicateLocalDocument,
  getDocumentById as getLocalDocumentById,
  listDocuments,
  listRecentDocuments as listLocalRecentDocuments,
  recordDocumentOpen as recordLocalDocumentOpen,
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

export async function duplicateDocument(id: string, payload: DuplicateDocumentPayload = {}): Promise<DocumentDetail> {
  return duplicateLocalDocument(id, payload)
}

export async function getRecentDocuments(limit = 5): Promise<RecentDocumentItem[]> {
  return listLocalRecentDocuments(limit)
}

export async function recordDocumentOpen(id: string): Promise<void> {
  recordLocalDocumentOpen(id)
}
