export class ConsonantForm {
    constructor(readonly text: string) {}

    isGeminated() {
        for (let index = 0; index < this.text.length - 1; index++) {
            if (this.text[index] == this.text[index + 1]) {
                return true
            }
        }

        return false
    }

    toString() {
        return this.text
    }
}
