import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from './core/services/file.service';
import { ApiService } from './core/services/api.service';
import { TerminalService } from './core/services/terminal.service';
import { FileTreeItemComponent } from './features/explorer/file-tree-item.component';
import { EditorTabsComponent } from './features/editor/editor-tabs.component';
import { MonacoEditorComponent } from './features/editor/monaco-editor.component';
import { AiChatComponent } from './features/chat/ai-chat.component';
import { TerminalPanelComponent } from './features/terminal/terminal-panel.component';
import { GitPanelComponent } from './features/git/git-panel.component';
import { LivePreviewComponent } from './features/preview/live-preview.component';
import { SettingsDialogComponent } from './features/settings/settings-dialog.component';
import { OpenProjectDialogComponent } from './features/workspace/open-project-dialog.component';
import { InstallPromptDialogComponent } from './features/terminal/install-prompt-dialog.component';
import { IconComponent } from './shared/components/icons';
import { ProjectInfo, IdeSettings } from './core/models/ide.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FileTreeItemComponent,
    EditorTabsComponent,
    MonacoEditorComponent,
    AiChatComponent,
    TerminalPanelComponent,
    GitPanelComponent,
    LivePreviewComponent,
    SettingsDialogComponent,
    OpenProjectDialogComponent,
    InstallPromptDialogComponent,
    IconComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  public fileService = inject(FileService);
  public terminalService = inject(TerminalService);
  private api = inject(ApiService);

  projectInfo = signal<ProjectInfo | null>(null);
  settings = signal<IdeSettings | null>(null);
  
  showSettings = signal<boolean>(false);
  showOpenProject = signal<boolean>(false);
  activeBottomTab = signal<'terminal' | 'git' | 'preview'>('preview');
  isBottomPanelCollapsed = signal<boolean>(false);

  constructor() {
    // When a dependency install is requested, automatically switch to terminal panel and expand it
    effect(() => {
      const pending = this.terminalService.pendingInstall();
      if (pending) {
        this.activeBottomTab.set('terminal');
        this.isBottomPanelCollapsed.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.refreshProject();
    this.refreshSettings();
  }

  refreshProject(): void {
    this.api.getProjectInfo().subscribe({
      next: (res) => this.projectInfo.set(res),
      error: () => {}
    });
  }

  refreshSettings(): void {
    this.api.getSettings().subscribe({
      next: (res) => this.settings.set(res),
      error: () => {}
    });
  }

  onProjectOpened(): void {
    this.refreshProject();
    this.refreshSettings();
    this.fileService.refreshTree();
  }

  handleRunFile(path?: string): void {
    const targetPath = path || this.fileService.activeTab()?.path;
    if (!targetPath) return;

    // Save active tab if dirty before running
    const activeTab = this.fileService.activeTab();
    if (activeTab && activeTab.path === targetPath && activeTab.isDirty) {
      this.fileService.saveActiveFile();
    }

    this.terminalService.runFile(
      targetPath,
      () => {
        // onPreview
        this.activeBottomTab.set('preview');
        this.isBottomPanelCollapsed.set(false);
      },
      () => {
        // onTerminal
        this.activeBottomTab.set('terminal');
        this.isBottomPanelCollapsed.set(false);
      }
    );
  }

  onInstallConfirmed(): void {
    this.activeBottomTab.set('terminal');
    this.isBottomPanelCollapsed.set(false);
  }

  createNewFileRoot(): void {
    const name = prompt('Enter new file name (e.g. index.html, app.py):');
    if (!name || !name.trim()) return;
    this.api.createItem(name.trim(), false).subscribe({
      next: () => {
        this.fileService.refreshTree();
        this.fileService.openFile(name.trim());
      }
    });
  }

  createNewFolderRoot(): void {
    const name = prompt('Enter new folder name (e.g. src, assets):');
    if (!name || !name.trim()) return;
    this.api.createItem(name.trim(), true).subscribe({
      next: () => {
        this.fileService.refreshTree();
      }
    });
  }
}
