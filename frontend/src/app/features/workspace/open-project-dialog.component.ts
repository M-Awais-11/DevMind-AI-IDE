import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { FileService } from '../../core/services/file.service';
import { IconComponent } from '../../shared/components/icons';

@Component({
  selector: 'app-open-project-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div class="bg-[#352d2d] border border-[#A8A492]/30 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden text-[#FCF2E5]">
        <!-- Header -->
        <div class="px-5 py-4 border-b border-[#A8A492]/20 flex items-center justify-between bg-[#524646]">
          <div class="flex items-center space-x-2.5">
            <app-icon name="folder-open" size="w-5 h-5" customClass="text-[#EC5B38]"></app-icon>
            <h3 class="font-bold text-sm text-[#FCF2E5] tracking-wide">Open Project Folder</h3>
          </div>
          <button (click)="close.emit()" class="text-[#A8A492] hover:text-[#FCF2E5] p-1 rounded transition-colors">
            <app-icon name="x" size="w-4 h-4"></app-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-[#FCF2E5] mb-1.5">
              Enter Project Directory Path
            </label>
            <div class="relative">
              <input 
                [(ngModel)]="projectPath"
                (keydown.enter)="open()"
                placeholder="e.g. C:\Users\Username\Projects\MyApp or ./workspace"
                class="w-full bg-[#272020] border border-[#A8A492]/40 rounded-lg p-3 text-[#FCF2E5] placeholder-[#A8A492]/60 focus:outline-none focus:border-[#EC5B38] font-mono text-xs shadow-inner"
              />
            </div>
            <p class="mt-1.5 text-[11px] text-[#A8A492]">
              You can open any existing folder on your computer to edit, debug, and develop with the AI assistant.
            </p>
          </div>

          <!-- Suggested / Quick Folders -->
          <div>
            <span class="text-[11px] font-semibold text-[#A8A492] uppercase tracking-wider block mb-2">Quick Locations:</span>
            <div class="flex flex-wrap gap-2">
              <button 
                (click)="projectPath = defaultWorkspace"
                class="bg-[#524646] hover:bg-[#5e5151] border border-[#A8A492]/30 text-[#FCF2E5] px-2.5 py-1.5 rounded text-[11px] font-mono transition-colors flex items-center space-x-1.5"
              >
                <app-icon name="folder" size="w-3.5 h-3.5" customClass="text-[#2196F3]"></app-icon>
                <span>Default Workspace</span>
              </button>
            </div>
          </div>

          <!-- Options -->
          <div class="flex items-center space-x-2 pt-1">
            <input 
              type="checkbox" 
              id="createMissing" 
              [(ngModel)]="createIfMissing" 
              class="rounded bg-[#272020] border-[#A8A492]/40 text-[#EC5B38] focus:ring-0"
            />
            <label for="createMissing" class="text-[#A8A492] select-none cursor-pointer">
              Create folder if it does not exist
            </label>
          </div>

          <!-- Error Alert -->
          @if (errorMessage) {
            <div class="bg-[#92003A]/20 border border-[#92003A] text-[#FCF2E5] p-2.5 rounded-lg text-xs flex items-center space-x-2">
              <span class="text-[#EC5B38] font-bold">[!]</span>
              <span>{{ errorMessage }}</span>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="px-5 py-3.5 border-t border-[#A8A492]/20 bg-[#2b2424] flex items-center justify-end space-x-2">
          <button 
            (click)="close.emit()"
            class="px-3 py-1.5 rounded-lg text-[#A8A492] hover:text-[#FCF2E5] hover:bg-[#524646] font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button 
            (click)="open()"
            [disabled]="isLoading || !projectPath.trim()"
            class="bg-[#EC5B38] hover:bg-[#f07355] disabled:opacity-50 text-[#FCF2E5] px-4 py-1.5 rounded-lg font-medium text-xs transition-colors shadow flex items-center space-x-1.5"
          >
            @if (isLoading) {
              <app-icon name="spinner" size="w-3.5 h-3.5"></app-icon>
              <span>Opening...</span>
            } @else {
              <span>Open Project</span>
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class OpenProjectDialogComponent {
  @Output() close = new EventEmitter<void>();
  @Output() projectOpened = new EventEmitter<void>();

  private api = inject(ApiService);
  private fileService = inject(FileService);

  projectPath = '';
  defaultWorkspace = './workspace';
  createIfMissing = false;
  isLoading = false;
  errorMessage = '';

  open(): void {
    if (!this.projectPath.trim() || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.api.openProject(this.projectPath.trim(), this.createIfMissing).subscribe({
      next: () => {
        this.isLoading = false;
        // Refresh tree and close open tabs from old project
        this.fileService.openTabs.set([]);
        this.fileService.activeTab.set(null);
        this.fileService.refreshTree();
        this.projectOpened.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || err.message || 'Failed to open project folder';
      }
    });
  }
}
