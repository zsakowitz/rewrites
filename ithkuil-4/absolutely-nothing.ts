import { getUsers } from "./cc.js"

const users = await getUsers()

export function showSignedUpUsers() {
    const signedUpUsers = [...document.querySelectorAll("div.ccDiv")]
        .map((div) => [div, div.getAttribute("id")!.slice(5)] as const)
        .map(
            ([div, id]) =>
                [
                    div,
                    users.filter((user) => user.commonClassroom == id),
                ] as const,
        )
        .flatMap(([div, users]) => {
            const names = document.createElement("div")
            div.appendChild(names)
            users.forEach((user) => {
                const p = document.createElement("p")
                names.appendChild(p)
                p.textContent = user.firstName + " " + user.lastName
            })
            return users
        })

    const notSignedUpUsers = users.filter((x) => !signedUpUsers.includes(x))

    return { signedUpUsers, notSignedUpUsers }
}
