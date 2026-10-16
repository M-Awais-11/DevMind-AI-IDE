import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TerminalService } from '../../core/services/terminal.service';
import { IconComponent } from '../../shared/components/icons';

@Component({
  selector: 'app-terminal-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="h-full flex flex-col bg-[#272020] text-[#FCF2E5] font-mono text-xs select-text">
      <!-- Terminal Output -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2.5">
        @for (entry of terminalService.entries(); track $index) {
          <div class="space-y-1">
            <div class="flex items-center space-x-2 text-[#A8A492]">
              <span class="text-[#EC5B38] font-bold font-mono">$</span>
              <span class="text-[#FCF2E5] font-semibold">{{ entry.command }}</span>
              <span class="text-[10px] text-[#A8A492]/60">({{ entry.timestamp }})</span>
            </div>
            <pre 
              class="whitespace-pre-wrap pl-4 text-xs font-mono leading-relaxed"
              [class.text-[#f87171]]="entry.isError"
              [class.text-[#FCF2E5]/90]="!entry.isError"
            >{{ entry.output }}</pre>
          </div>
        }
      </div>

      <!-- Dependency Install Prompt Banner -->
      @if (terminalService.pendingInstall(); as install) {
        <div class="px-3 py-2 bg-[#524646] border-t border-b border-[#EC5B38]/50 flex items-center justify-between text-xs animate-pulse-slow">
          <div class="flex items-center space-x-2 min-w-0">
            <app-icon name="alert-circle" size="w-4 h-4" customClass="text-[#EC5B38] flex-shrink-0"></app-icon>
            <span class="text-[#FCF2E5] font-sans">
              Missing dependency detected. Do you want to install <span class="font-mono text-[#EC5B38] font-bold">{{ install.label }}</span>?
            </span>
            <span class="text-[11px] text-[#A8A492] font-mono hidden md:inline truncate">({{ install.command }})</span>
          </div>
          <div class="flex items-center space-x-2 flex-shrink-0 ml-3">
            <button
              (click)="terminalService.confirmInstall()"
              class="bg-[#EC5B38] hover:bg-[#f07355] text-[#FCF2E5] px-3 py-1 rounded text-xs font-semibold shadow transition-colors font-sans"
            >
              Install Now
            </button>
            <button
              (click)="terminalService.dismissInstall()"
              class="text-[#A8A492] hover:text-[#FCF2E5] px-2 py-1 rounded text-xs hover:bg-[#272020] transition-colors font-sans"
            >
              Cancel
            </button>
          </div>
        </div>
      }

      <!-- Responsive Command Input -->
      <div class="p-2.5 border-t border-[#A8A492]/20 bg-[#352d2d] flex items-center space-x-2">
        <div class="flex items-center space-x-1 text-[#EC5B38] pl-1">
          <app-icon name="terminal" size="w-3.5 h-3.5"></app-icon>
          <span class="font-bold font-mono text-sm">$</span>
        </div>

        <input 
          [(ngModel)]="cmdInput" 
          (keydown.enter)="execute()"
          [disabled]="terminalService.isRunning()"
          placeholder="Execute shell command in workspace (e.g. dir, python --version, git status)..." 
          class="flex-1 bg-[#272020] border border-[#A8A492]/30 rounded px-2.5 py-1.5 text-[#FCF2E5] placeholder-[#A8A492]/60 focus:outline-none focus:border-[#EC5B38] text-xs font-mono transition-colors min-w-[120px]"
        />

        @if (terminalService.isRunning()) {
          <app-icon name="spinner" size="w-4 h-4" customClass="text-[#EC5B38]"></app-icon>
        }

        <button 
          (click)="execute()"
          [disabled]="terminalService.isRunning() || !cmdInput.trim()"
          class="bg-[#EC5B38] hover:bg-[#f07355] disabled:opacity-50 text-[#FCF2E5] px-3 py-1.5 rounded font-semibold text-xs transition-colors shadow"
        >
          Run
        </button>

        <button 
          (click)="terminalService.clear()"
          class="text-[#A8A492] hover:text-[#FCF2E5] px-2 py-1.5 rounded text-xs hover:bg-[#524646] transition-colors"
          title="Clear terminal"
        >
          Clear
        </button>
      </div>
    </div>
  `
})
export class TerminalPanelComponent {
  public terminalService = inject(TerminalService);
  cmdInput = '';

  execute(): void {
    if (!this.cmdInput.trim() || this.terminalService.isRunning()) return;
    const cmd = this.cmdInput;
    this.cmdInput = '';
    this.terminalService.runCommand(cmd);
  }
}
