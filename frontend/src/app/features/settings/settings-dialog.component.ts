import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { IdeSettings } from '../../core/models/ide.models';
import { IconComponent } from '../../shared/components/icons';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div class="bg-[#352d2d] border border-[#A8A492]/30 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden text-[#FCF2E5]">
        <!-- Dialog Header -->
        <div class="px-5 py-4 border-b border-[#A8A492]/20 flex items-center justify-between bg-[#524646]">
          <div class="flex items-center space-x-2.5">
            <app-icon name="settings" size="w-5 h-5" customClass="text-[#EC5B38]"></app-icon>
            <h3 class="font-bold text-[#FCF2E5] text-sm tracking-wide">IDE & AI Settings</h3>
          </div>
          <button (click)="close.emit()" class="text-[#A8A492] hover:text-[#FCF2E5] p-1 rounded transition-colors">
            <app-icon name="x" size="w-4 h-4"></app-icon>
          </button>
        </div>

        <!-- Dialog Body -->
        <div class="p-5 space-y-4 text-xs">
          <!-- OpenRouter API Key -->
          <div>
            <label class="block font-semibold text-[#FCF2E5] mb-1.5">
              OpenRouter AI API Key
            </label>
            <div class="relative">
              <input 
                [type]="showKey ? 'text' : 'password'"
                [(ngModel)]="apiKey"
                placeholder="sk-or-v1-..."
                class="w-full bg-[#272020] border border-[#A8A492]/30 rounded-lg p-2.5 text-[#FCF2E5] placeholder-[#A8A492]/60 focus:outline-none focus:border-[#EC5B38] font-mono text-xs"
              />
              <button 
                (click)="showKey = !showKey"
                class="absolute right-3 top-2.5 text-[#A8A492] hover:text-[#FCF2E5]"
              >
                {{ showKey ? 'Hide' : 'Show' }}
              </button>
            </div>
            <p class="mt-1.5 text-[11px] text-[#A8A492]">
              Get your key from <a href="https://openrouter.ai/keys" target="_blank" class="text-[#2196F3] hover:underline">openrouter.ai/keys</a>
            </p>
          </div>

          <!-- Model Name -->
          <div>
            <label class="block font-semibold text-[#FCF2E5] mb-1.5">
              OpenRouter Model
            </label>
            <input 
              [(ngModel)]="model"
              placeholder="e.g. openai/gpt-4o-mini or google/gemini-2.0-flash-exp:free"
              class="w-full bg-[#272020] border border-[#A8A492]/30 rounded-lg p-2.5 text-[#FCF2E5] font-mono text-xs focus:outline-none focus:border-[#EC5B38]"
            />
            <div class="mt-2 flex flex-wrap gap-1.5 items-center">
              <span class="text-[10px] text-[#A8A492]">Popular Models:</span>
              <button 
                (click)="model = 'openai/gpt-4o-mini'"
                class="bg-[#524646] hover:bg-[#5e5151] text-[#2196F3] text-[10px] font-mono px-2 py-0.5 rounded border border-[#A8A492]/30"
              >
                gpt-4o-mini
              </button>
              <button 
                (click)="model = 'google/gemini-2.0-flash-exp:free'"
                class="bg-[#524646] hover:bg-[#5e5151] text-[#2196F3] text-[10px] font-mono px-2 py-0.5 rounded border border-[#A8A492]/30"
              >
                gemini-2.0-flash:free
              </button>
              <button 
                (click)="model = 'qwen/qwen-2.5-coder-32b-instruct:free'"
                class="bg-[#524646] hover:bg-[#5e5151] text-[#2196F3] text-[10px] font-mono px-2 py-0.5 rounded border border-[#A8A492]/30"
              >
                qwen-2.5-coder:free
              </button>
            </div>
          </div>

          <!-- Workspace Directory -->
          <div>
            <label class="block font-semibold text-[#FCF2E5] mb-1.5">
              Active Workspace Folder
            </label>
            <input 
              [(ngModel)]="workspaceRoot"
              placeholder="./workspace"
              class="w-full bg-[#272020] border border-[#A8A492]/30 rounded-lg p-2.5 text-[#FCF2E5] font-mono text-xs focus:outline-none focus:border-[#EC5B38]"
            />
            <p class="mt-1 text-[11px] text-[#A8A492]">Workspace files and commands run inside this path.</p>
          </div>

          <!-- Auto-Approve Safe Tools -->
          <div class="flex items-center space-x-2 pt-1">
            <input 
              type="checkbox" 
              id="autoApprove" 
              [(ngModel)]="autoApprove" 
              class="rounded bg-[#272020] border-[#A8A492]/40 text-[#EC5B38] focus:ring-0"
            />
            <label for="autoApprove" class="text-[#A8A492] select-none cursor-pointer">
              Automatically execute safe read tools without prompt
            </label>
          </div>
        </div>

        <!-- Dialog Footer -->
        <div class="px-5 py-3.5 border-t border-[#A8A492]/20 bg-[#2b2424] flex items-center justify-between">
          <span class="text-[#2196F3] text-xs font-mono" *ngIf="saveSuccess">Settings saved!</span>
          <span *ngIf="!saveSuccess"></span>

          <div class="flex items-center space-x-2">
            <button 
              (click)="close.emit()"
              class="px-3 py-1.5 rounded-lg text-[#A8A492] hover:text-[#FCF2E5] hover:bg-[#524646] font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button 
              (click)="saveSettings()"
              class="bg-[#EC5B38] hover:bg-[#f07355] text-[#FCF2E5] px-4 py-1.5 rounded-lg font-semibold text-xs transition-colors shadow"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsDialogComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private api = inject(ApiService);

  apiKey = '';
  model = 'openai/gpt-4o-mini';
  workspaceRoot = '';
  autoApprove = true;
  showKey = false;
  saveSuccess = false;

  ngOnInit(): void {
    this.api.getSettings().subscribe({
      next: (res) => {
        this.model = res.openrouter_model;
        this.workspaceRoot = res.workspace_root;
        this.autoApprove = res.auto_approve_safe_tools;
      }
    });
  }

  saveSettings(): void {
    this.api.updateSettings({
      openrouter_api_key: this.apiKey || undefined,
      openrouter_model: this.model || undefined,
      workspace_root: this.workspaceRoot || undefined,
      auto_approve_safe_tools: this.autoApprove
    }).subscribe({
      next: () => {
        this.saveSuccess = true;
        setTimeout(() => {
          this.close.emit();
        }, 800);
      }
    });
  }
}
