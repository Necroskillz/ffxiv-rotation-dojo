import { Observable, Subject } from 'rxjs';

interface KeyEvent {
  key: string;
  modifier: string | null;
  event: Event;
}

const subject = new Subject<KeyEvent>();

export function useKeyEvents(): [Observable<KeyEvent>, (key: string, modifier: string | null, event: Event) => void] {
  function next(key: string, modifier: string | null, event: Event) {
    subject.next({ key, modifier, event });
  }

  return [subject.asObservable(), next];
}
