import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../core/services/file.service';
import { IconComponent } from '../../shared/components/icons';

declare const require: any;
declare const monaco: any;

@Component({
  selector: 'app-monaco-editor',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="h-full w-full relative flex flex-col bg-[#272020]">
      @if (!fileService.activeTab()) {
        <div class="flex-1 flex flex-col items-center justify-center text-[#A8A492] space-y-3 p-6 text-center select-none">
          <div class="p-4 rounded-2xl bg-[#352d2d] border border-[#A8A492]/20 shadow-lg">
            <app-icon name="code" size="w-10 h-10" customClass="text-[#EC5B38]"></app-icon>
          </div>
          <p class="text-base font-bold text-[#FCF2E5] tracking-wide">AI Coding IDE</p>
          <p class="text-xs text-[#A8A492] max-w-sm">Select a file from the explorer on the left or instruct the AI assistant to create one.</p>
          <div class="text-xs text-[#A8A492] bg-[#352d2d] px-3.5 py-1.5 rounded-lg border border-[#A8A492]/30 flex items-center space-x-2">
            <span>Shortcut:</span>
            <kbd class="bg-[#524646] px-1.5 py-0.5 rounded text-[#FCF2E5] font-mono text-[11px]">Ctrl + S</kbd>
            <span>to save changes</span>
          </div>
        </div>
      }
      <div #editorContainer class="flex-1 w-full h-full" [class.hidden]="!fileService.activeTab()"></div>
    </div>
  `
})
export class MonacoEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer') editorContainer!: ElementRef<HTMLDivElement>;
  public fileService = inject(FileService);

  private editor: any = null;
  private isMonacoReady = false;
  private currentModelPath: string | null = null;
  private updatingFromCode = false;

  constructor() {
    effect(() => {
      const active = this.fileService.activeTab();
      if (this.isMonacoReady && active) {
        this.loadTabIntoEditor(active);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMonaco();
  }

  private initMonaco(): void {
    if (typeof require !== 'undefined') {
      require.config({
        paths: {
          vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
        }
      });

      require(['vs/editor/editor.main'], () => {
        this.defineCustomTheme();
        this.createEditor();
      });
    } else {
      setTimeout(() => this.initMonaco(), 200);
    }
  }

  private defineCustomTheme(): void {
    monaco.editor.defineTheme('ide-palette-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: 'A8A492', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'EC5B38', fontStyle: 'bold' },
        { token: 'string', foreground: 'FCF2E5' },
        { token: 'number', foreground: '2196F3' },
        { token: 'type', foreground: '2196F3' },
        { token: 'tag', foreground: 'EC5B38' },
        { token: 'attribute.name', foreground: 'A8A492' }
      ],
      colors: {
        'editor.background': '#272020',
        'editor.foreground': '#FCF2E5',
        'editorCursor.foreground': '#EC5B38',
        'editor.lineHighlightBackground': '#352d2d',
        'editorLineNumber.foreground': '#A8A492',
        'editorLineNumber.activeForeground': '#FCF2E5',
        'editor.selectionBackground': '#524646',
        'editor.inactiveSelectionBackground': '#352d2d',
        'editorWidget.background': '#352d2d',
        'editorWidget.border': '#A8A492'
      }
    });
  }

  private createEditor(): void {
    if (!this.editorContainer) return;

    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      value: '',
      language: 'plaintext',
      theme: 'ide-palette-theme',
      automaticLayout: true,
      fontSize: 14,
      fontFamily: "'Fira Code', monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      tabSize: 2,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      renderWhitespace: 'selection'
    });

    this.editor.onDidChangeModelContent(() => {
      if (this.updatingFromCode) return;
      const content = this.editor.getValue();
      this.fileService.updateActiveContent(content);
    });

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      this.fileService.saveActiveFile();
    });

    this.isMonacoReady = true;

    const active = this.fileService.activeTab();
    if (active) {
      this.loadTabIntoEditor(active);
    }
  }

  private loadTabIntoEditor(tab: any): void {
    if (!this.editor) return;

    if (this.currentModelPath === tab.path) {
      if (this.editor.getValue() !== tab.content) {
        this.updatingFromCode = true;
        this.editor.setValue(tab.content);
        this.updatingFromCode = false;
      }
      return;
    }

    this.currentModelPath = tab.path;
    this.updatingFromCode = true;
    const model = monaco.editor.createModel(tab.content, tab.language);
    this.editor.setModel(model);
    this.updatingFromCode = false;
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.dispose();
    }
  }
}
