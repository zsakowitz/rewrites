import tests from "promises-aplus-tests"
import { Deferred } from "./deferred"

tests({
  pending: () => new Deferred(),
  resolve: Deferred.resolve,
  reject: Deferred.reject,
})
