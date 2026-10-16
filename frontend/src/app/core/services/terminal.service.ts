import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface TerminalEntry {
  command: string;
  output: string;
  isError: boolean;
  timestamp: string;
}

export interface PendingInstall {
  command: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class TerminalService {
  private api = inject(ApiService);

  entries = signal<TerminalEntry[]>([
    {
      command: 'system info',
      output: 'DevMind Terminal ready. Sandboxed to active workspace.\nType any shell command (e.g., dir, python --version, git status).',
      isError: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  isRunning = signal<boolean>(false);

  /** Holds a pending dependency install prompt */
  pendingInstall = signal<PendingInstall | null>(null);

  /** Holds the result type from last resolve-run call */
  lastRunType = signal<'terminal' | 'preview' | null>(null);

  runCommand(command: string): void {
    if (!command.trim() || this.isRunning()) return;

    this.isRunning.set(true);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.api.executeTerminalCommand(command).subscribe({
      next: (res) => {
        const out = (res.stdout ? res.stdout : '') + (res.stderr ? '\n' + res.stderr : '');
        const trimmedOut = out.trim() || `(Process exited with code ${res.exit_code})`;

        this.entries.update(entries => [
          ...entries,
          {
            command,
            output: trimmedOut,
            isError: !res.success,
            timestamp: timeStr
          }
        ]);

        // Auto-detect missing dependency errors and prompt install
        this._detectMissingDep(trimmedOut, command);

        this.isRunning.set(false);
      },
      error: (err) => {
        this.entries.update(entries => [
          ...entries,
          {
            command,
            output: `Failed to execute: ${err.message}`,
            isError: true,
            timestamp: timeStr
          }
        ]);
        this.isRunning.set(false);
      }
    });
  }

  /**
   * Run a file: calls backend resolve-run, then either runs the terminal command
   * or returns 'preview' so the caller can switch to the Live Preview tab.
   * Returns the resolved type so app.ts can switch tabs.
   */
  runFile(
    filePath: string,
    onPreview: () => void,
    onTerminal: () => void
  ): void {
    this.api.resolveRun(filePath).subscribe({
      next: (res) => {
        this.lastRunType.set(res.type);
        if (res.type === 'preview') {
          onPreview();
        } else if (res.command) {
          onTerminal();
          this.runCommand(res.command);
        }
      },
      error: () => {
        // fallback: just switch to terminal
        onTerminal();
      }
    });
  }

  /** Request a dependency install prompt */
  requestInstall(command: string, label: string): void {
    this.pendingInstall.set({ command, label });
  }

  /** User confirmed install — run the install command */
  confirmInstall(): void {
    const pending = this.pendingInstall();
    if (!pending) return;
    this.pendingInstall.set(null);
    this.runCommand(pending.command);
  }

  /** User dismissed the install prompt */
  dismissInstall(): void {
    this.pendingInstall.set(null);
  }

  clear(): void {
    this.entries.set([]);
  }

  // ───── private helpers ─────

  private _detectMissingDep(output: string, sourceCommand: string): void {
    // Python
    const pyMatch = output.match(/ModuleNotFoundError:\s+No module named ['"]([^'"]+)['"]/);
    if (pyMatch) {
      const mod = pyMatch[1].split('.')[0]; // top-level package name
      this.requestInstall(`pip install ${mod}`, mod);
      return;
    }

    // Node.js
    const nodeMatch = output.match(/Cannot find module ['"]([^'"./][^'"]*)['"]/);
    if (nodeMatch) {
      const mod = nodeMatch[1];
      this.requestInstall(`npm install ${mod}`, mod);
      return;
    }
  }
}
