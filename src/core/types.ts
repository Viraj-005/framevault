export type Platform = 'behance' | 'dribbble' | 'unknown';

export type CandidateStatus = 'ready' | 'saved' | 'duplicate' | 'failed' | 'skipped';

export interface ImageCandidate {
  candidateId: string;
  platform: Platform;
  sourcePageUrl: string;
  sourcePageTitle?: string;
  sourceItemUrl?: string;
  imageUrl: string;
  previewUrl?: string;
  altText?: string;
  authorName?: string;
  position: number;
  selected: boolean;
  extractionWarnings: string[];
}

export interface CollectedAssetRecord {
  recordId: string;
  candidateId: string;
  sourcePageUrl: string;
  sourceImageUrl: string;
  localRelativePath?: string;
  filename?: string;
  mimeType?: string;
  byteSize?: number;
  sha256?: string;
  status: CandidateStatus;
  failureCode?: string;
  failureMessage?: string;
  collectedAt: string;
}

export interface CollectionOptions {
  exportJson: boolean;
  exportCsv: boolean;
  removeDuplicates: boolean;
  maxImages: number;
  imageFormat: ImageFormat;
}

export type ImageFormat = 'original' | 'png' | 'jpg';

export interface CollectionSummary {
  saved: number;
  duplicates: number;
  failed: number;
  skipped: number;
  folderLabel: string;
  relativePath: string;
  failures: Array<{ candidateId: string; position: number; reason: string }>;
}

export type ScanResponse = {
  kind: 'scan-response';
  platform: Platform;
  queryText: string;
  pageTitle: string;
  pageUrl: string;
  candidates: ImageCandidate[];
};
