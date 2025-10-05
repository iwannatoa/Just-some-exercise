export interface EntryListResponse<T> {
  status: 'SUCCESS' | 'FAILED';
  message?: string;
  entries: T[];
  entryCount: string;
}

export interface EntryResponse<T> {
  status: 'SUCCESS' | 'FAILED';
  message?: string;
  entry: T;
}
