// Sample code that is a mockup for chapter 1 of Brilliant's cryptocurrency
// course.

const N = 576429
const G = 104713

export class User {
  readonly #secretKey: number
  readonly publicKey: number

  constructor(secretKey: number) {
    this.#secretKey = secretKey
    this.publicKey = (secretKey * G) % N
  }

  send(message: number) {
    return new Message(message, this, (message * this.#secretKey) % N)
  }
}

export class Message {
  readonly message: number
  readonly signature: number
  readonly sender: User

  constructor(message: number, sender: User, signature: number) {
    this.message = message
    this.signature = signature
    this.sender = sender
  }

  verify() {
    return (
      (this.sender.publicKey * this.message) % N == (this.signature * G) % N
    )
  }
}
