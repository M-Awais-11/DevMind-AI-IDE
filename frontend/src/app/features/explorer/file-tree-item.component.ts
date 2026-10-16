import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileNode } from '../../core/models/ide.models';
import { FileService } from '../../core/services/file.service';
import { ApiService } from '../../core/services/api.service';
import { IconComponent } from '../../shared/components/icons';

@Component({
  selector: 'app-file-tree-item',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div>
      <div 
        class="flex items-center justify-between px-2 py-1 cursor-pointer rounded text-xs transition-colors group select-none"
        [class.bg-[#524646]]="isActive()"
        [class.text-[#FCF2E5]]="isActive()"
        [class.hover:bg-[#524646]/60]="!isActive()"
        [class.text-[#A8A492]]="!isActive()"
        [style.padding-left.rem]="depth * 0.75 + 0.5"
        (click)="handleClick()"
      >
        <div class="flex items-center space-x-2 min-w-0 overflow-hidden">
          <!-- Folder Icon / Chevron -->
          @if (node.is_directory) {
            <span class="text-[#A8A492] w-3 inline-block">
              <app-icon [name]="isExpanded() ? 'chevron-down' : 'chevron-right'" size="w-3 h-3"></app-icon>
            </span>
            <app-icon [name]="isExpanded() ? 'folder-open' : 'folder'" size="w-4 h-4" customClass="text-[#EC5B38]"></app-icon>
          } @else {
            <span class="w-3"></span>
            <app-icon [name]="getFileIconName(node.extension)" size="w-3.5 h-3.5" [customClass]="getFileIconColor(node.extension)"></app-icon>
          }
          <span class="truncate font-mono text-[11px] group-hover:text-[#FCF2E5]">{{ node.name }}</span>
        </div>

        <!-- Action Icons (visible on hover) -->
        <div class="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
          @if (node.is_directory) {
            <button 
              (click)="$event.stopPropagation(); createNewItem(false)" 
              class="hover:text-[#FCF2E5] text-[#A8A492] p-1 rounded hover:bg-[#272020]"
              title="New File Inside"
            >
              <app-icon name="plus" size="w-3 h-3"></app-icon>
            </button>
          }
          <button 
            (click)="$event.stopPropagation(); deleteItem()" 
            class="hover:text-[#EC5B38] text-[#A8A492] p-1 rounded hover:bg-[#272020]"
            title="Delete"
          >
            <app-icon name="trash" size="w-3 h-3"></app-icon>
          </button>
        </div>
      </div>

      <!-- Recursive Children -->
      @if (node.is_directory && isExpanded() && node.children) {
        <div>
          @for (child of node.children; track child.path) {
            <app-file-tree-item [node]="child" [depth]="depth + 1"></app-file-tree-item>
          }
        </div>
      }
    </div>
  `
})
export class FileTreeItemComponent {
  @Input({ required: true }) node!: FileNode;
  @Input() depth: number = 0;

  private fileService = inject(FileService);
  private api = inject(ApiService);

  isExpanded = signal<boolean>(true);

  isActive(): boolean {
    const active = this.fileService.activeTab();
    return !this.node.is_directory && active?.path === this.node.path;
  }

  handleClick(): void {
    if (this.node.is_directory) {
      this.isExpanded.update(v => !v);
    } else {
      this.fileService.openFile(this.node.path);
    }
  }

  createNewItem(isDirectory: boolean): void {
    const name = prompt(isDirectory ? 'Enter folder name:' : 'Enter file name:');
    if (!name || !name.trim()) return;

    const fullPath = this.node.path === '/' ? name.trim() : `${this.node.path}/${name.trim()}`;
    this.api.createItem(fullPath, isDirectory).subscribe({
      next: () => {
        this.fileService.refreshTree();
        if (!isDirectory) {
          this.fileService.openFile(fullPath);
        }
      }
    });
  }

  deleteItem(): void {
    if (!confirm(`Are you sure you want to delete ${this.node.name}?`)) return;

    this.api.deleteItem(this.node.path).subscribe({
      next: () => {
        if (!this.node.is_directory) {
          this.fileService.closeTab(this.node.path);
        }
        this.fileService.refreshTree();
      }
    });
  }

  getFileIconName(ext?: string): string {
    switch (ext?.toLowerCase()) {
      case 'html': case 'htm':
      case 'js': case 'jsx':
      case 'ts': case 'tsx':
      case 'py':
      case 'css':
      case 'json':
        return 'file-code';
      default:
        return 'file';
    }
  }

  getFileIconColor(ext?: string): string {
    switch (ext?.toLowerCase()) {
      case 'html': return 'text-[#EC5B38]';
      case 'css': return 'text-[#2196F3]';
      case 'js': case 'ts': return 'text-[#A8A492]';
      case 'py': return 'text-[#2196F3]';
      case 'json': return 'text-[#A8A492]';
      default: return 'text-[#A8A492]/80';
    }
  }
}
