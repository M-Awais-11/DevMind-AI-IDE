import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { FileNode, EditorTab } from '../models/ide.models';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private api = inject(ApiService);

  fileTree = signal<FileNode | null>(null);
  openTabs = signal<EditorTab[]>([]);
  activeTab = signal<EditorTab | null>(null);
  isLoadingTree = signal<boolean>(false);

  constructor() {
    this.refreshTree();
  }

  refreshTree(): void {
    this.isLoadingTree.set(true);
    this.api.getFilesTree().subscribe({
      next: (tree) => {
        this.fileTree.set(tree);
        this.isLoadingTree.set(false);
      },
      error: () => {
        this.isLoadingTree.set(false);
      }
    });
  }

  openFile(path: string): void {
    // Check if tab is already open
    const currentTabs = this.openTabs();
    const existing = currentTabs.find(t => t.path === path);
    if (existing) {
      this.activeTab.set(existing);
      return;
    }

    // Otherwise fetch content and open tab
    this.api.getFileContent(path).subscribe({
      next: (res) => {
        const name = path.split('/').pop() || path;
        const lang = this.detectLanguage(path);
        const newTab: EditorTab = {
          path,
          name,
          content: res.content,
          originalContent: res.content,
          isDirty: false,
          language: lang
        };

        this.openTabs.set([...currentTabs, newTab]);
        this.activeTab.set(newTab);
      }
    });
  }

  closeTab(path: string): void {
    const currentTabs = this.openTabs();
    const newTabs = currentTabs.filter(t => t.path !== path);
    this.openTabs.set(newTabs);

    const currentActive = this.activeTab();
    if (currentActive && currentActive.path === path) {
      this.activeTab.set(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    }
  }

  setActiveTab(tab: EditorTab): void {
    this.activeTab.set(tab);
  }

  updateActiveContent(newContent: string): void {
    const current = this.activeTab();
    if (!current) return;

    const isDirty = newContent !== current.originalContent;
    const updatedTab: EditorTab = {
      ...current,
      content: newContent,
      isDirty
    };

    this.activeTab.set(updatedTab);
    this.openTabs.set(
      this.openTabs().map(t => (t.path === current.path ? updatedTab : t))
    );
  }

  saveActiveFile(): void {
    const current = this.activeTab();
    if (!current || !current.isDirty) return;

    this.api.saveFile(current.path, current.content).subscribe({
      next: () => {
        const savedTab: EditorTab = {
          ...current,
          originalContent: current.content,
          isDirty: false
        };
        this.activeTab.set(savedTab);
        this.openTabs.set(
          this.openTabs().map(t => (t.path === current.path ? savedTab : t))
        );
      }
    });
  }

  detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html': case 'htm': return 'html';
      case 'css': return 'css';
      case 'js': case 'jsx': case 'mjs': return 'javascript';
      case 'ts': case 'tsx': return 'typescript';
      case 'py': return 'python';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'sql': return 'sql';
      case 'sh': case 'bash': return 'shell';
      case 'yaml': case 'yml': return 'yaml';
      default: return 'plaintext';
    }
  }
}
