export function sampleDocumentHref(fileName: string) {
  return `/documents/${encodeURIComponent(fileName)}?v=2`;
}
