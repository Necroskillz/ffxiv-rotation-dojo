import { Observable, Subject } from 'rxjs';

interface KeyEvent {
  key: string;
  modifier: string | null;
  event: KeyboardEvent;
}

const subject = new Subject<KeyEvent>();

export function useKeyEvents(): [Observable<KeyEvent>, (key: string, modifier: string | null, event: KeyboardEvent) => void] {
  function next(key: string, modifier: string | null, event: KeyboardEvent) {
    subject.next({ key, modifier, event });
  }

  return [subject.asObservable(), next];
}
