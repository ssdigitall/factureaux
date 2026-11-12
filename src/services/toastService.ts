export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastService {
  private toasts: ToastItem[] = [];
  private listeners: ToastListener[] = [];

  public subscribe(listener: ToastListener): () => void {
    this.listeners.push(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l([...this.toasts]));
  }

  public show(message: string, type: ToastType = 'info', durationMs: number = 4000): string {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const item: ToastItem = { id, message, type, durationMs };
    this.toasts = [...this.toasts, item];
    this.notify();

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
    return id;
  }

  public success(message: string, durationMs: number = 4000): string {
    return this.show(message, 'success', durationMs);
  }

  public error(message: string, durationMs: number = 5000): string {
    return this.show(message, 'error', durationMs);
  }

  public warning(message: string, durationMs: number = 4500): string {
    return this.show(message, 'warning', durationMs);
  }

  public info(message: string, durationMs: number = 4000): string {
    return this.show(message, 'info', durationMs);
  }

  public dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  public clearAll() {
    this.toasts = [];
    this.notify();
  }
}

export const toast = new ToastService();
