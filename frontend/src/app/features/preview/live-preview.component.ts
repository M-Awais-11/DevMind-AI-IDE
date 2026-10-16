import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/components/icons';

@Component({
  selector: 'app-live-preview',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="h-full flex flex-col bg-white">
      <!-- Preview Browser Header Bar -->
      <div class="bg-[#352d2d] border-b border-[#A8A492]/20 px-3 py-1.5 flex items-center justify-between text-xs text-[#FCF2E5]">
        <div class="flex items-center space-x-2 flex-1 mr-4">
          <button 
            (click)="reloadIframe()"
            class="text-[#A8A492] hover:text-[#FCF2E5] p-1 rounded hover:bg-[#524646] transition-colors"
            title="Reload Preview"
          >
            <app-icon name="refresh" size="w-3.5 h-3.5"></app-icon>
          </button>
          <div class="flex-1 bg-[#272020] border border-[#A8A492]/30 rounded px-2.5 py-1 text-[11px] font-mono text-[#FCF2E5] truncate">
            http://127.0.0.1:8000/api/preview/
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <a 
            href="http://127.0.0.1:8000/api/preview/" 
            target="_blank"
            class="text-[#A8A492] hover:text-[#FCF2E5] text-[11px] bg-[#524646] hover:bg-[#5e5151] px-2.5 py-1 rounded transition-colors flex items-center space-x-1.5"
            title="Open preview in a separate browser tab"
          >
            <span>Open External</span>
            <app-icon name="external-link" size="w-3 h-3"></app-icon>
          </a>
        </div>
      </div>

      <!-- Iframe Container -->
      <div class="flex-1 w-full h-full relative bg-[#1f1a1a]">
        <iframe 
          #previewFrame
          src="http://127.0.0.1:8000/api/preview/"
          class="w-full h-full border-none bg-white"
        ></iframe>
      </div>
    </div>
  `
})
export class LivePreviewComponent {
  @ViewChild('previewFrame') previewFrame!: ElementRef<HTMLIFrameElement>;

  reloadIframe(): void {
    if (this.previewFrame) {
      this.previewFrame.nativeElement.src = 'http://127.0.0.1:8000/api/preview/?t=' + Date.now();
    }
  }
}
