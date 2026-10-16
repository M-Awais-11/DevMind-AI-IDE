import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { GitStatus } from '../../core/models/ide.models';
import { IconComponent } from '../../shared/components/icons';

@Component({
  selector: 'app-git-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="h-full flex flex-col bg-[#272020] text-xs p-3 space-y-3 select-text">
      <!-- Top info bar -->
      <div class="flex items-center justify-between pb-2 border-b border-[#A8A492]/20">
        <div class="flex items-center space-x-2">
          <app-icon name="git-branch" size="w-4 h-4" customClass="text-[#EC5B38]"></app-icon>
          <span class="text-[#A8A492]">Branch:</span>
          <span class="font-mono text-[#2196F3] font-bold">{{ status()?.branch || 'None' }}</span>
        </div>
        <button 
          (click)="refresh()" 
          class="text-[#A8A492] hover:text-[#FCF2E5] p-1 rounded hover:bg-[#524646] flex items-center space-x-1.5 transition-colors"
          title="Refresh Git Status"
        >
          <app-icon name="refresh" size="w-3.5 h-3.5"></app-icon>
          <span>Refresh</span>
        </button>
      </div>

      <!-- Modified & Untracked Files -->
      <div class="flex-1 overflow-y-auto space-y-3 font-mono">
        <!-- Modified Files -->
        <div>
          <div class="text-[11px] font-semibold text-[#A8A492] mb-1 flex items-center justify-between">
            <span>MODIFIED ({{ status()?.modified?.length || 0 }})</span>
          </div>
          @if (status()?.modified?.length === 0) {
            <p class="text-[11px] text-[#A8A492]/60 italic">No modified files</p>
          } @else {
            <div class="space-y-1">
              @for (file of status()?.modified; track file) {
                <div class="flex items-center justify-between text-[#EC5B38] bg-[#352d2d] px-2.5 py-1 rounded border border-[#A8A492]/20">
                  <span>{{ file }}</span>
                  <span class="text-[10px] text-[#A8A492]">MOD</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Untracked Files -->
        <div>
          <div class="text-[11px] font-semibold text-[#A8A492] mb-1">
            UNTRACKED ({{ status()?.untracked?.length || 0 }})
          </div>
          @if (status()?.untracked?.length === 0) {
            <p class="text-[11px] text-[#A8A492]/60 italic">No untracked files</p>
          } @else {
            <div class="space-y-1">
              @for (file of status()?.untracked; track file) {
                <div class="flex items-center justify-between text-[#2196F3] bg-[#352d2d] px-2.5 py-1 rounded border border-[#A8A492]/20">
                  <span>{{ file }}</span>
                  <span class="text-[10px] text-[#A8A492]">NEW</span>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Commit Section -->
      <div class="pt-2 border-t border-[#A8A492]/20 flex items-center space-x-2">
        <input 
          [(ngModel)]="commitMessage" 
          placeholder="Enter commit message..." 
          class="flex-1 bg-[#352d2d] border border-[#A8A492]/30 rounded px-2.5 py-1.5 text-xs text-[#FCF2E5] placeholder-[#A8A492]/60 focus:outline-none focus:border-[#EC5B38] transition-colors"
        />
        <button 
          (click)="commit()" 
          [disabled]="isCommitting() || !commitMessage.trim()"
          class="bg-[#EC5B38] hover:bg-[#f07355] disabled:opacity-50 text-[#FCF2E5] px-4 py-1.5 rounded font-semibold transition-colors shadow"
        >
          {{ isCommitting() ? 'Committing...' : 'Commit' }}
        </button>
      </div>
    </div>
  `
})
export class GitPanelComponent implements OnInit {
  private api = inject(ApiService);

  status = signal<GitStatus | null>(null);
  commitMessage = '';
  isCommitting = signal<boolean>(false);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.api.getGitStatus().subscribe({
      next: (res) => this.status.set(res),
      error: () => {}
    });
  }

  commit(): void {
    if (!this.commitMessage.trim() || this.isCommitting()) return;
    this.isCommitting.set(true);
    this.api.commitGit(this.commitMessage).subscribe({
      next: () => {
        this.commitMessage = '';
        this.isCommitting.set(false);
        this.refresh();
      },
      error: (err) => {
        alert(`Commit failed: ${err.message}`);
        this.isCommitting.set(false);
      }
    });
  }
}
