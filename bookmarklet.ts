export function makeBookmark(text: string) {
  return 'javascript:' + encodeURIComponent(`(()=>{${text}})();void 0`);
}
