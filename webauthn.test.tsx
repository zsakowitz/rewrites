// An HTML page that experiments with the WebAuthn API.

import { f, h, render, signal } from "./easy-jsx.js"

const [emailEl, setEmailEl] = signal<HTMLInputElement>(null!)

const body = (
  <>
    <input type="text" autocomplete="email webauthn" use={setEmailEl} />

    <button
      on:click={async () => {
        if (typeof PublicKeyCredential !== "undefined") {
          try {
            const challenge = new Uint8Array(32)
            window.crypto.getRandomValues(challenge)

            const response = await navigator.credentials.create({
              publicKey: {
                challenge,
                pubKeyCredParams: [
                  { alg: -7, type: "public-key" },
                  { alg: -257, type: "public-key" },
                ],
                rp: {
                  name: "webauthn test",
                  id: "localhost",
                },
                user: {
                  displayName: "Zachary Sakowitz",
                  id: Uint8Array.from("zsakowitz@gmail.com", (x) =>
                    x.charCodeAt(0),
                  ),
                  name: "zsakowitz@gmail.com",
                },
                authenticatorSelection: {
                  authenticatorAttachment: "cross-platform",
                },
              },
            })

            console.log(response)
          } catch (err) {
            console.error("Error with conditional UI:", err)
          }
        }
      }}
    >
      create new credentials
    </button>

    <button
      on:click={async () => {
        if (
          typeof PublicKeyCredential !== "undefined" &&
          "isConditionalMediationAvailable" in PublicKeyCredential &&
          typeof PublicKeyCredential.isConditionalMediationAvailable ==
            "function"
        ) {
          const available: boolean =
            await PublicKeyCredential.isConditionalMediationAvailable()

          if (available) {
            try {
              const challenge = new Uint8Array(32)
              window.crypto.getRandomValues(challenge)

              const autoFillResponse = await navigator.credentials.get({
                publicKey: {
                  challenge,
                  rpId: "localhost",
                  userVerification: "required",
                },
              })

              console.log(autoFillResponse)
            } catch (err) {
              console.error("Error with conditional UI:", err)
            }
          }
        }
      }}
    >
      get existing credentials
    </button>
  </>
)

render(document.body, body)
