export interface FileNode {
  name: string;
  path: string;
  is_directory: boolean;
  size?: number;
  extension?: string;
  children?: FileNode[];
  isExpanded?: boolean;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  read_only?: boolean;
}

export interface EditorTab {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  language: string;
}

export interface ProjectInfo {
  workspace_root: string;
  folder_name: string;
  type: string;
  language: string;
  framework: string;
  build_command?: string;
  test_command?: string;
  files_count: number;
  summary: string;
}

export interface GitStatus {
  branch: string;
  is_repo: boolean;
  modified: string[];
  untracked: string[];
  staged: string[];
}

export interface IdeSettings {
  openrouter_api_key_set: boolean;
  openrouter_model: string;
  workspace_root: string;
  auto_approve_safe_tools: boolean;
}
