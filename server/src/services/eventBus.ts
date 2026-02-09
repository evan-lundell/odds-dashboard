import { EventEmitter } from 'events';
import type { SSEEventMap, SSEEventType } from '../types/sse.js';

class TypedEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  emit<K extends SSEEventType>(event: K, payload: SSEEventMap[K]): void {
    this.emitter.emit(event, payload);
  }

  on<K extends SSEEventType>(event: K, handler: (payload: SSEEventMap[K]) => void): void {
    this.emitter.on(event, handler);
  }

  off<K extends SSEEventType>(event: K, handler: (payload: SSEEventMap[K]) => void): void {
    this.emitter.off(event, handler);
  }
}

export const eventBus = new TypedEventBus();
