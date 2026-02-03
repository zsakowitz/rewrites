import type { initializeApp } from "firebase/app"
import type { GoogleAuthProvider, getAuth } from "firebase/auth"
import type { getFirestore } from "firebase/firestore"

declare namespace ExportsDotJS {
    export const app: ReturnType<typeof initializeApp>

    export const db: ReturnType<typeof getFirestore>

    export const auth: ReturnType<typeof getAuth>

    export const provider: GoogleAuthProvider

    export const firebaseConfig: {
        apiKey: string
        appId: `${number}:${number}:web:${string}`
        authDomain: string
        databaseURL: string
        messagingSenderId: `${number}`
        projectId: string
        storageBucket: string
    }
}

export const { app, db, auth, provider, firebaseConfig } = (await import(
    // @ts-ignore
    "/exports.js".toString()
)) as typeof ExportsDotJS
