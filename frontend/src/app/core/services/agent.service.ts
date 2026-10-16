import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { FileService } from './file.service';
import { AgentMessage, AgentStep } from '../models/agent.models';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private api = inject(ApiService);
  private fileService = inject(FileService);

  messages = signal<AgentMessage[]>([]);
  isBusy = signal<boolean>(false);
  currentStatus = signal<string>('Ready');
  currentSteps = signal<AgentStep[]>([]);
  private ws: WebSocket | null = null;

  constructor() {
    this.messages.set([
      {
        sender: 'agent',
        content: 'Hello! I am your AI Developer Assistant powered by OpenRouter AI. Give me instructions to create, edit, debug, or explain files in your project.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }

  sendMessage(prompt: string, activeFile?: string): void {
    if (!prompt.trim() || this.isBusy()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: AgentMessage = {
      sender: 'user',
      content: prompt,
      timestamp: timeStr
    };

    this.messages.update(msgs => [...msgs, userMsg]);
    this.isBusy.set(true);
    this.currentStatus.set('Connecting to AI Agent...');
    this.currentSteps.set([]);

    // Open WebSocket to Agent
    const wsUrl = 'ws://127.0.0.1:8000/ws/agent';
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.currentStatus.set('Agent analyzing workspace...');
        const payload = {
          prompt,
          session_id: 'default',
          active_file: activeFile || null,
          open_files: this.fileService.openTabs().map(t => t.path)
        };
        this.ws?.send(JSON.stringify(payload));
      };

      this.ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          this.handleEvent(packet);
        } catch (e) {
          console.error('Error parsing agent message:', e);
        }
      };

      this.ws.onerror = () => {
        this.fallbackToHttp(prompt, activeFile);
      };

      this.ws.onclose = () => {
        this.isBusy.set(false);
      };

    } catch (e) {
      this.fallbackToHttp(prompt, activeFile);
    }
  }

  private handleEvent(packet: { type: string; data: any }): void {
    const { type, data } = packet;

    if (type === 'status') {
      this.currentStatus.set(data.message || 'Processing...');
      if (data.completed) {
        this.isBusy.set(false);
        this.fileService.refreshTree();
      }
    } else if (type === 'tool_call') {
      this.currentStatus.set(`Calling tool: ${data.tool}`);
      const newStep: AgentStep = {
        step: this.currentSteps().length + 1,
        tool: data.tool,
        args: data.args
      };
      this.currentSteps.update(steps => [...steps, newStep]);
    } else if (type === 'tool_result') {
      this.currentSteps.update(steps => {
        if (steps.length === 0) return steps;
        const last = { ...steps[steps.length - 1] };
        last.success = data.success;
        last.output_preview = data.output;
        return [...steps.slice(0, -1), last];
      });
      // Refresh tree whenever files change
      if (['write_file', 'patch_file', 'delete_file', 'create_directory'].includes(data.tool)) {
        this.fileService.refreshTree();
      }
    } else if (type === 'message') {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const agentMsg: AgentMessage = {
        sender: 'agent',
        content: data.content,
        timestamp: timeStr,
        steps: [...this.currentSteps()]
      };
      this.messages.update(msgs => [...msgs, agentMsg]);
      this.currentSteps.set([]);
      this.isBusy.set(false);
      this.currentStatus.set('Ready');
      this.fileService.refreshTree();
    } else if (type === 'error') {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const errMsg: AgentMessage = {
        sender: 'agent',
        content: data.message,
        timestamp: timeStr,
        error: true
      };
      this.messages.update(msgs => [...msgs, errMsg]);
      this.isBusy.set(false);
      this.currentStatus.set('Error occurred');
    }
  }

  private fallbackToHttp(prompt: string, activeFile?: string): void {
    this.currentStatus.set('Sending request via HTTP...');
    const body = {
      prompt,
      session_id: 'default',
      active_file: activeFile || null,
      open_files: this.fileService.openTabs().map(t => t.path)
    };

    fetch('http://127.0.0.1:8000/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const agentMsg: AgentMessage = {
          sender: 'agent',
          content: data.answer || 'Completed',
          timestamp: timeStr,
          steps: data.steps || [],
          error: !data.success
        };
        this.messages.update(msgs => [...msgs, agentMsg]);
        this.isBusy.set(false);
        this.currentStatus.set('Ready');
        this.fileService.refreshTree();
      })
      .catch(err => {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.messages.update(msgs => [
          ...msgs,
          {
            sender: 'agent',
            content: `Connection failed: ${err.message}. Is backend running?`,
            timestamp: timeStr,
            error: true
          }
        ]);
        this.isBusy.set(false);
        this.currentStatus.set('Error');
      });
  }
}
