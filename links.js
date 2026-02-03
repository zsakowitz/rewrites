const people = `Emma
Ethan
Sophia
Liam
Olivia
Noah
Ava
Mason
Isabella
Jacob
Mia
William
Charlotte
James
Amelia
Benjamin
Harper
Elijah
Evelyn
Alexander`.split("\n")

const c2 = [
    "Emma, Ethan, Sophia, Liam",
    "Olivia, Noah, Ava, Mason, Isabella",
    "Jacob, Mia, William, Charlotte",
    "James, Amelia, Benjamin, Harper",
    "Elijah, Evelyn, Alexander, Olivia",
    "Noah, Mia, Charlotte, William, Ava, Mason",
]

const c4 = [
    "Emma, Benjamin",
    "Sophia, Alexander",
    "Liam, Harper",
    "Isabella, Evelyn",
    "Ethan, Mia",
]

const c1 = [
    "Sophia, Emma",
    "Sophia, Ethan",
    "Sophia, Liam",
    "Sophia, Ava",
    "Sophia, Mason",
    "Sophia, Isabella",
    "Sophia, Jacob",
    "Sophia, William",
    "Sophia, Charlotte",
    "Sophia, Amelia",
    "Sophia, Harper",
    "Noah, Olivia",
    "Noah, Ava",
    "Noah, Mason",
    "Noah, Isabella",
    "Noah, Mia",
    "Noah, William",
    "Noah, Charlotte",
    "Noah, Elijah",
    "Noah, Evelyn",
    "Noah, Alexander",
]

function link(
    /** @type {string[]} */
    list,
) {
    return (
        "\\left["
        + list
            .map((group) => {
                const members = group
                    .split(", ")
                    .map((person) => people.indexOf(person) + 1)

                return members
                    .map((a, i) =>
                        members
                            .slice(0, i)
                            .map((b) => `\\left(${a},${b}\\right)`)
                            .join(","),
                    )
                    .filter((x) => x)
                    .join(",")
            })
            .filter((x) => x)
            .join(",")
        + "\\right]"
    )
}
