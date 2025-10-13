/**
 * SelectionStore - Manages block selection state with Set-based operations
 * Supports Include and Exclude modes with invert functionality
 */

export type SelectionMode = 'include' | 'exclude';

export class SelectionStore {
  private selected: Set<string> = new Set();
  private mode: SelectionMode = 'include';
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Load mode from localStorage
    const savedMode = localStorage.getItem('blocks-selection-mode');
    if (savedMode === 'include' || savedMode === 'exclude') {
      this.mode = savedMode;
    }
  }

  getMode(): SelectionMode {
    return this.mode;
  }

  setMode(mode: SelectionMode): void {
    this.mode = mode;
    localStorage.setItem('blocks-selection-mode', mode);
    this.notifyListeners();
  }

  isSelected(id: string): boolean {
    return this.selected.has(id);
  }

  setSelected(id: string, selected: boolean): void {
    if (selected) {
      this.selected.add(id);
    } else {
      this.selected.delete(id);
    }
    this.notifyListeners();
  }

  toggle(id: string): void {
    if (this.selected.has(id)) {
      this.selected.delete(id);
    } else {
      this.selected.add(id);
    }
    this.notifyListeners();
  }

  add(id: string): void {
    this.selected.add(id);
    this.notifyListeners();
  }

  selectMany(ids: string[]): void {
    ids.forEach(id => this.selected.add(id));
    this.notifyListeners();
  }

  selectAll(ids: string[]): void {
    ids.forEach(id => this.selected.add(id));
    this.notifyListeners();
  }

  clearAll(): void {
    this.selected.clear();
    this.notifyListeners();
  }

  getSelected(): Set<string> {
    return new Set(this.selected);
  }

  getSelectedArray(): string[] {
    return Array.from(this.selected);
  }

  getCount(): number {
    return this.selected.size;
  }

  invert(allIds: string[]): void {
    const newSelection = new Set<string>();
    allIds.forEach(id => {
      if (!this.selected.has(id)) {
        newSelection.add(id);
      }
    });
    this.selected = newSelection;
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}
