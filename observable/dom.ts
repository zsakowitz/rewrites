import { Observable } from "."

export function listen<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  event: K
): Observable<HTMLElementEventMap[K]>

export function listen(
  element: HTMLElement,
  event: string,
  options?: boolean | AddEventListenerOptions
): Observable<Event>

export function listen(
  element: HTMLElement,
  event: string,
  options?: boolean | AddEventListenerOptions
): Observable<Event> {
  return new Observable((observer) => {
    function listener(event: Event) {
      observer.next(event)
    }

    element.addEventListener(event, listener, options)

    return () => {
      element.removeEventListener(event, listener, options)
    }
  })
}
