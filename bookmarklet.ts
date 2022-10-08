// Makes a javascript: bookmarklet with URI safety from a string of JS code.
// #bookmarklet

export function makeBookmark(text: string) {
  return "javascript:" + encodeURIComponent(`(()=>{${text}})();void 0`);
}
