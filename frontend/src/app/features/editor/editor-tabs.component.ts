import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../core/services/file.service';
import { EditorTab } from '../../core/models/ide.models';
import { IconComponent } from '../../shared/components/icons';

@Component({
  selector: 'app-editor-tabs',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="flex items-center justify-between bg-[#352d2d] border-b border-[#A8A492]/20 text-xs overflow-x-auto select-none">
      <div class="flex items-center overflow-x-auto scrollbar-none">
        @for (tab of fileService.openTabs(); track tab.path) {
          <div 
            class="flex items-center space-x-2 px-3 py-2 border-r border-[#A8A492]/20 cursor-pointer transition-colors border-t-2"
            [class.bg-[#272020]]="fileService.activeTab()?.path === tab.path"
            [class.border-t-[#EC5B38]]="fileService.activeTab()?.path === tab.path"
            [class.border-t-transparent]="fileService.activeTab()?.path !== tab.path"
            [class.text-[#FCF2E5]]="fileService.activeTab()?.path === tab.path"
            [class.text-[#A8A492]]="fileService.activeTab()?.path !== tab.path"
            (click)="fileService.setActiveTab(tab)"
          >
            <span class="font-mono text-[11px]">{{ tab.name }}</span>

            <!-- Unsaved Dirty Dot Indicator -->
            @if (tab.isDirty) {
              <span class="w-1.5 h-1.5 rounded-full bg-[#EC5B38] inline-block" title="Unsaved changes"></span>
            }

            <!-- Close Tab Button -->
            <button 
              (click)="$event.stopPropagation(); fileService.closeTab(tab.path)"
              class="hover:bg-[#524646] p-0.5 rounded text-[#A8A492] hover:text-[#FCF2E5] transition-colors"
            >
              <app-icon name="x" size="w-2.5 h-2.5"></app-icon>
            </button>
          </div>
        }
      </div>

      <!-- Right-side actions: Save + Run -->
      <div class="flex items-center space-x-1 px-2 flex-shrink-0">
        <!-- Quick Save Button (only when dirty) -->
        @if (fileService.activeTab()?.isDirty) {
          <button 
            (click)="fileService.saveActiveFile()"
            class="bg-[#524646] hover:bg-[#EC5B38] text-[#FCF2E5] px-2.5 py-1 rounded text-[11px] font-medium flex items-center space-x-1.5 shadow transition-colors"
            title="Save File (Ctrl+S)"
          >
            <span>Save</span>
            <span class="text-[9px] opacity-75 font-mono">Ctrl+S</span>
          </button>
        }

        <!-- Run File Button (always visible when a tab is open) -->
        @if (fileService.activeTab()) {
          <button
            (click)="runActiveFile()"
            class="bg-[#2196F3] hover:bg-[#42a5f5] text-[#FCF2E5] px-2.5 py-1 rounded text-[11px] font-semibold flex items-center space-x-1.5 shadow transition-colors"
            title="Run active file"
          >
            <app-icon name="play" size="w-3 h-3"></app-icon>
            <span>Run</span>
          </button>
        }
      </div>
    </div>
  `
})
export class EditorTabsComponent {
  public fileService = inject(FileService);

  @Output() runFile = new EventEmitter<string>();

  runActiveFile(): void {
    const tab = this.fileService.activeTab();
    if (!tab) return;
    // Save first if dirty, then emit the file path
    if (tab.isDirty) {
      this.fileService.saveActiveFile();
    }
    this.runFile.emit(tab.path);
  }
}
