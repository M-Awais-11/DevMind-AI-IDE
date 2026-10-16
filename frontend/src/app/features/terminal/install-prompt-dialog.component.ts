import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TerminalService, PendingInstall } from '../../core/services/terminal.service';
import { IconComponent } from '../../shared/components/icons';

@Component({
  selector: 'app-install-prompt-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (install) {
      <!-- Backdrop -->
      <div class="fixed inset-0 z-50 flex items-end justify-center pb-8 pointer-events-none">
        <!-- Toast Card -->
        <div
          class="pointer-events-auto flex items-center space-x-4 bg-[#352d2d] border border-[#EC5B38]/60 rounded-lg shadow-2xl px-5 py-4 max-w-xl w-full mx-4 animate-slide-up"
          style="animation: slideUp 0.2s ease-out;"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 w-9 h-9 rounded-full bg-[#EC5B38]/15 border border-[#EC5B38]/40 flex items-center justify-center">
            <app-icon name="terminal" size="w-4 h-4" customClass="text-[#EC5B38]"></app-icon>
          </div>

          <!-- Text -->
          <div class="flex-1 min-w-0">
            <p class="text-[#FCF2E5] text-sm font-semibold">Dependency not found</p>
            <p class="text-[#A8A492] text-xs mt-0.5">
              DevMind detected a missing package. Install it now?
            </p>
            <p class="text-[#EC5B38] font-mono text-xs mt-1 truncate">
              {{ install.command }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-2 flex-shrink-0">
            <button
              (click)="confirm()"
              class="bg-[#EC5B38] hover:bg-[#f07355] text-[#FCF2E5] px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow"
            >
              Install Now
            </button>
            <button
              (click)="dismiss()"
              class="text-[#A8A492] hover:text-[#FCF2E5] px-2 py-1.5 rounded text-xs hover:bg-[#524646] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class InstallPromptDialogComponent {
  @Input() install: PendingInstall | null = null;
  @Output() onInstall = new EventEmitter<void>();
  @Output() onDismiss = new EventEmitter<void>();

  private terminalService = inject(TerminalService);

  confirm(): void {
    this.terminalService.confirmInstall();
    this.onInstall.emit();
  }

  dismiss(): void {
    this.terminalService.dismissInstall();
    this.onDismiss.emit();
  }
}
