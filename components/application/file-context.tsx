"use client";

import { createContext, useContext } from "react";

export type FileMode = "primary" | "senior";

export interface FileWorkspaceValue {
  id: string;
  mode: FileMode;
  basePath: string;
  readOnly: boolean;
}

export const FileWorkspaceContext = createContext<FileWorkspaceValue | null>(null);

export function useFileWorkspace() {
  const value = useContext(FileWorkspaceContext);
  if (!value) throw new Error("useFileWorkspace must be used within FileWorkspace");
  return value;
}
