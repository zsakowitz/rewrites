// Makes any text look sArCaStIc.

export function sArCaStIcIfY(text: string) {
  let result = "";
  let uppercase = false;

  for (const character of text) {
    if (/[A-Za-z]/.test(character)) {
      result += uppercase ? character.toUpperCase() : character.toLowerCase();
      uppercase = !uppercase;
    } else {
      result += character;
    }
  }

  return result;
}
