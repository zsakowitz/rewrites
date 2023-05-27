// #::exclude

import { SubscriberFunction, SubscriptionObserver } from "."
import { getMethod } from "./get-method"
import { throwTypeError } from "./throw-type-error"

export function executeSubscriber<T>(
  subscriber: SubscriberFunction<T>,
  observer: SubscriptionObserver<T>,
) {
  // 3. Let subscriberResult be ? Call(subscriber, undefined, observer).
  const subscriberResult = subscriber(observer)

  // 4. If subscriberResult is null or undefined, return undefined.
  if (subscriberResult == null) {
    return undefined
  }

  // 5. If IsCallable(subscriberResult) is true, return subscriberResult.
  if (typeof subscriberResult == "function") {
    return subscriberResult
  }

  // 6. Let result be ? GetMethod(subscriberResult, "unsubscribe").
  const result = getMethod(subscriberResult, "unsubscribe")

  // 7. If result is undefined, throw a TypeError exception.
  if (typeof result == "undefined") {
    throwTypeError("function", result)
  }

  return () => {
    subscriberResult.unsubscribe()
  }
}
