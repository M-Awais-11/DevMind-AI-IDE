import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileNode, FileContent, ProjectInfo, GitStatus, IdeSettings } from '../models/ide.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  public readonly baseUrl = 'http://127.0.0.1:8000';

  // Files
  getFilesTree(): Observable<FileNode> {
    return this.http.get<FileNode>(`${this.baseUrl}/api/files/tree`);
  }

  getFileContent(path: string): Observable<FileContent> {
    return this.http.get<FileContent>(`${this.baseUrl}/api/files/content?path=${encodeURIComponent(path)}`);
  }

  saveFile(path: string, content: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/api/files/save`, { path, content });
  }

  createItem(path: string, isDirectory: boolean): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/api/files/create`, {
      path,
      is_directory: isDirectory
    });
  }

  deleteItem(path: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/api/files/delete?path=${encodeURIComponent(path)}`);
  }

  // Project & Settings
  getProjectInfo(): Observable<ProjectInfo> {
    return this.http.get<ProjectInfo>(`${this.baseUrl}/api/projects/current`);
  }

  openProject(path: string, createIfMissing: boolean = false): Observable<{
    success: boolean;
    workspace_root: string;
    folder_name: string;
    type: string;
    language: string;
    framework: string;
    files_count: number;
    summary: string;
  }> {
    return this.http.post<any>(`${this.baseUrl}/api/projects/open`, {
      path,
      create_if_missing: createIfMissing
    });
  }

  getSettings(): Observable<IdeSettings> {
    return this.http.get<IdeSettings>(`${this.baseUrl}/api/projects/settings`);
  }

  updateSettings(data: {
    openrouter_api_key?: string;
    openrouter_model?: string;
    workspace_root?: string;
    auto_approve_safe_tools?: boolean;
  }): Observable<IdeSettings> {
    return this.http.post<IdeSettings>(`${this.baseUrl}/api/projects/settings`, data);
  }

  // Git
  getGitStatus(): Observable<GitStatus> {
    return this.http.get<GitStatus>(`${this.baseUrl}/api/git/status`);
  }

  commitGit(message: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/api/git/commit`, {
      message,
      stage_all: true
    });
  }

  // Terminal
  executeTerminalCommand(command: string): Observable<{
    command: string;
    stdout: string;
    stderr: string;
    exit_code: number;
    success: boolean;
  }> {
    return this.http.post<any>(`${this.baseUrl}/api/terminal/execute`, { command });
  }

  resolveRun(path: string): Observable<{ type: 'terminal' | 'preview'; command: string | null }> {
    return this.http.post<any>(`${this.baseUrl}/api/terminal/resolve-run`, { path });
  }
}
