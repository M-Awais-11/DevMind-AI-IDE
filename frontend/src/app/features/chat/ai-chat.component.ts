import { Component, inject, ViewChild, ElementRef, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentService } from '../../core/services/agent.service';
import { FileService } from '../../core/services/file.service';
import { IconComponent } from '../../shared/components/icons';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  host: {
    class: 'h-full flex flex-col min-h-0 overflow-hidden'
  },
  template: `
    <div class="h-full flex flex-col min-h-0 overflow-hidden bg-[#272020] border-l border-[#A8A492]/20 text-xs select-text">
      <!-- Header -->
      <div class="p-3 border-b border-[#A8A492]/20 flex items-center justify-between bg-[#524646] flex-shrink-0">
        <div class="flex items-center space-x-2">
          <div class="p-1 rounded bg-[#352d2d] border border-[#A8A492]/30 text-[#EC5B38]">
            <app-icon name="code" size="w-3.5 h-3.5"></app-icon>
          </div>
          <div>
            <h3 class="font-bold text-[#FCF2E5] text-xs">DevMind Assistant</h3>
            <span class="text-[10px] text-[#A8A492] font-mono">OpenRouter AI</span>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button 
            (click)="clearChat()" 
            class="text-[#A8A492] hover:text-[#FCF2E5] p-1 rounded hover:bg-[#352d2d] text-[10px] transition-colors"
            title="Clear Chat View"
          >
            Clear
          </button>
          <div class="flex items-center space-x-1.5 pl-1">
            <span 
              class="w-2 h-2 rounded-full" 
              [class.bg-[#2196F3]]="!agentService.isBusy()" 
              [class.bg-[#EC5B38]]="agentService.isBusy()"
              [class.animate-pulse]="agentService.isBusy()"
            ></span>
            <span class="text-[10px] text-[#A8A492]">
              {{ agentService.isBusy() ? 'Working' : 'Ready' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Live Agent Status Banner -->
      @if (agentService.isBusy()) {
        <div class="bg-[#352d2d] border-b border-[#EC5B38]/30 px-3 py-1.5 flex items-center space-x-2 text-[11px] text-[#FCF2E5] flex-shrink-0">
          <app-icon name="spinner" size="w-3.5 h-3.5" customClass="text-[#EC5B38]"></app-icon>
          <span class="truncate font-mono">{{ agentService.currentStatus() }}</span>
        </div>
      }

      <!-- Messages Feed (Scrollable with smooth touch/mousewheel support) -->
      <div 
        #scrollContainer 
        (scroll)="onScroll()"
        class="flex-1 overflow-y-auto min-h-0 p-3 space-y-3.5 overscroll-contain"
        style="scroll-behavior: smooth;"
      >
        @for (msg of agentService.messages(); track $index) {
          <div 
            class="flex flex-col space-y-1"
            [class.items-end]="msg.sender === 'user'"
            [class.items-start]="msg.sender === 'agent'"
          >
            <!-- Sender & Time -->
            <div class="flex items-center space-x-1.5 text-[10px] text-[#A8A492] px-1">
              <span class="font-medium" [class.text-[#EC5B38]]="msg.sender === 'user'" [class.text-[#2196F3]]="msg.sender === 'agent'">
                {{ msg.sender === 'user' ? 'You' : 'DevMind' }}
              </span>
              <span>•</span>
              <span>{{ msg.timestamp }}</span>
            </div>

            <!-- Bubble Content -->
            <div 
              class="max-w-[94%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap font-sans text-xs break-words shadow-sm"
              [class.bg-[#EC5B38]]="msg.sender === 'user'"
              [class.text-[#FCF2E5]]="msg.sender === 'user'"
              [class.bg-[#352d2d]]="msg.sender === 'agent' && !msg.error"
              [class.border]="msg.sender === 'agent' && !msg.error"
              [class.border-[#A8A492]/25]="msg.sender === 'agent' && !msg.error"
              [class.text-[#FCF2E5]]="msg.sender === 'agent' && !msg.error"
              [class.bg-[#92003A]/25]="msg.error"
              [class.border-2]="msg.error"
              [class.border-[#92003A]]="msg.error"
              [class.text-[#FCF2E5]]="msg.error"
            >
              {{ msg.content }}

              <!-- Executed Steps Checklist -->
              @if (msg.steps && msg.steps.length > 0) {
                <div class="mt-2.5 pt-2 border-t border-[#A8A492]/20 space-y-1.5 font-mono text-[11px]">
                  <div class="text-[10px] uppercase tracking-wider text-[#A8A492] font-bold">Actions Taken:</div>
                  @for (step of msg.steps; track step.step) {
                    <div class="bg-[#272020] rounded p-2 border border-[#A8A492]/20 flex items-start space-x-2">
                      <app-icon name="check" size="w-3.5 h-3.5" customClass="text-[#2196F3] mt-0.5 flex-shrink-0"></app-icon>
                      <div class="flex-1 overflow-hidden">
                        <span class="text-[#2196F3] font-semibold">{{ step.tool }}</span>
                        @if (step.args?.path) {
                          <span class="text-[#A8A492]"> ({{ step.args.path }})</span>
                        } @else if (step.args?.command) {
                          <span class="text-[#EC5B38]"> ($ {{ step.args.command }})</span>
                        }
                        @if (step.output_preview) {
                          <div class="text-[10px] text-[#A8A492]/80 truncate mt-0.5">{{ step.output_preview }}</div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- In-progress Live Steps -->
        @if (agentService.isBusy() && agentService.currentSteps().length > 0) {
          <div class="p-2.5 bg-[#352d2d] rounded-xl border border-[#EC5B38]/30 space-y-1.5 font-mono text-[11px]">
            <div class="text-[10px] uppercase tracking-wider text-[#EC5B38] font-bold flex items-center space-x-1.5">
              <app-icon name="spinner" size="w-3 h-3"></app-icon>
              <span>Executing Actions...</span>
            </div>
            @for (step of agentService.currentSteps(); track step.step) {
              <div class="flex items-center space-x-2 text-[#FCF2E5]">
                <app-icon 
                  [name]="step.success === undefined ? 'spinner' : 'check'" 
                  size="w-3 h-3" 
                  [customClass]="step.success === undefined ? 'text-[#EC5B38]' : 'text-[#2196F3]'"
                ></app-icon>
                <span class="font-semibold text-[#2196F3]">{{ step.tool }}</span>
                @if (step.args?.path) {
                  <span class="text-[#A8A492]">({{ step.args.path }})</span>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Quick Action Prompt Pills (Responsive flex-shrink-0) -->
      <div class="px-3 py-2 border-t border-[#A8A492]/20 bg-[#352d2d] flex flex-wrap gap-1.5 flex-shrink-0">
        <button 
          (click)="sendQuickPrompt('Create a modern responsive portfolio website with hero, about, projects, contact form, and dark mode.')"
          class="bg-[#524646] hover:bg-[#5e5151] text-[#FCF2E5] px-2.5 py-1 rounded text-[11px] transition-colors border border-[#A8A492]/30 flex-grow sm:flex-grow-0"
        >
          Portfolio Website
        </button>
        <button 
          (click)="sendQuickPrompt('Add modern dark/light mode toggle with CSS variables to the project.')"
          class="bg-[#524646] hover:bg-[#5e5151] text-[#FCF2E5] px-2.5 py-1 rounded text-[11px] transition-colors border border-[#A8A492]/30 flex-grow sm:flex-grow-0"
        >
          Dark Mode
        </button>
        <button 
          (click)="sendQuickPrompt('Inspect the workspace and explain the structure and code.')"
          class="bg-[#524646] hover:bg-[#5e5151] text-[#FCF2E5] px-2.5 py-1 rounded text-[11px] transition-colors border border-[#A8A492]/30 flex-grow sm:flex-grow-0"
        >
          Explain Project
        </button>
      </div>

      <!-- Input Bar (Fully Responsive) -->
      <div class="p-3 border-t border-[#A8A492]/20 bg-[#352d2d] flex-shrink-0">
        <div class="relative flex flex-col space-y-2">
          <textarea
            [(ngModel)]="promptText"
            (keydown.enter)="handleEnter($event)"
            [disabled]="agentService.isBusy()"
            placeholder="Instruct DevMind to build, edit, or test code... (Enter to send)"
            rows="3"
            class="w-full bg-[#272020] border border-[#A8A492]/30 rounded-lg p-2.5 text-xs text-[#FCF2E5] placeholder-[#A8A492]/60 focus:outline-none focus:border-[#EC5B38] resize-y min-h-[60px] max-h-[180px] font-sans transition-colors"
          ></textarea>

          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="text-[11px] text-[#A8A492] truncate max-w-[200px]">
              Active: <strong class="text-[#FCF2E5] font-mono">{{ fileService.activeTab()?.name || 'None' }}</strong>
            </span>
            <button
              (click)="submitPrompt()"
              [disabled]="agentService.isBusy() || !promptText.trim()"
              class="bg-[#EC5B38] hover:bg-[#f07355] disabled:opacity-50 text-[#FCF2E5] px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow"
            >
              @if (agentService.isBusy()) {
                <app-icon name="spinner" size="w-3.5 h-3.5"></app-icon>
                <span>Working...</span>
              } @else {
                <span>Send</span>
                <app-icon name="send" size="w-3 h-3"></app-icon>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AiChatComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  public agentService = inject(AgentService);
  public fileService = inject(FileService);

  promptText = '';
  private userScrolledUp = false;
  private lastMessageCount = 0;

  ngAfterViewChecked(): void {
    const currentCount = this.agentService.messages().length + (this.agentService.isBusy() ? 1 : 0);
    if (currentCount !== this.lastMessageCount) {
      this.lastMessageCount = currentCount;
      if (!this.userScrolledUp) {
        this.scrollToBottom();
      }
    }
  }

  onScroll(): void {
    if (!this.scrollContainer) return;
    const el = this.scrollContainer.nativeElement;
    // Check if user is near the bottom (within 40px)
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    this.userScrolledUp = !isNearBottom;
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  clearChat(): void {
    this.agentService.messages.set([
      {
        sender: 'agent',
        content: 'Chat cleared. How can DevMind help you now?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }

  handleEnter(event: any): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.submitPrompt();
    }
  }

  submitPrompt(): void {
    if (!this.promptText.trim() || this.agentService.isBusy()) return;
    const text = this.promptText;
    this.promptText = '';
    this.userScrolledUp = false;
    const activePath = this.fileService.activeTab()?.path;
    this.agentService.sendMessage(text, activePath);
    setTimeout(() => this.scrollToBottom(), 50);
  }

  sendQuickPrompt(prompt: string): void {
    if (this.agentService.isBusy()) return;
    this.userScrolledUp = false;
    const activePath = this.fileService.activeTab()?.path;
    this.agentService.sendMessage(prompt, activePath);
    setTimeout(() => this.scrollToBottom(), 50);
  }
}
