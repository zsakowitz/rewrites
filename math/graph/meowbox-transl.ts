type Transl = {
  [x: string]: string | ((...args: (string | number)[]) => string) | Transl
}

export const transls = {
  condoDoesNotExist: (id) => `Condo ${id} does not exist.`,
  helpMain: `Each numbered circle above is a cat condo. Dark blue condos are currently meowing.
Right-click a condo to feed its cat. Feeding all condos with a black ring should satiate the cats.
A condo's number is its ID. These are used when typing commands.
Use 0 as an ID to create a new condo. Use * as an ID to match all condos.
You can drag an individual condo, or the entire configuration.
Dragging one condo very far out, then releasing, often creates a less chaotic configuration.
Scroll with a mouse or pinch on a trackpad to zoom.`,
  cmd: {
    new: "Creates a new cat condo.",
    newRet: (x) => `Created cat condo ${x} (not meowing).`,
    link: "Links multiple condos in a chain.",
    linkShorthand:
      "Links condos in a chain; if all links are already present, removes those links.",
    rm: "Removes one or more condos.",
    rmRet: (x) => `Removed #${x}.`,

    unlink: `Removes all links to the passed condo.`,
    unlinkRet0: (x) => `${x} is already isolated.`,
    unlinkRet: (x) => `Removed ${x} connection(s).`,

    cycle: `Creates a cycle ending at some condo.`,
    rect: `Creates a rectangle with a corner at some condo.`,
    chain: `Creates a chain starting at some condo.`,

    linkCycle: `Links multiple condos into a cycle.`,
    linkEvery: `Creates all possible links between the given condos.`,
    linkToAll: `Links each passed condo to EVERY other condo.`,

    meowId: `meow`,
    meowDesc: `Invokes elder gods to disrupt the calm of one or more cats.`,
    meowRetAlready: (x) => `${x} is already meowing.`,
    meowRetOn: (x) => `Forced cat ${x} to meow.`,

    hushId: `hush`,
    hushDesc: `Sings a lullaby to pause the meowing of one or more cats.`,
    hushRetAlready: (x) => `${x} is already quiet.`,
    hushRetOn: (x) => `Forced cat ${x} to be quiet.`,

    feedId: `feed`,
    feedDesc: `Feeds one or more cats.`,
    feedRet: (x) => `Fed cat ${x}.`,

    meowRandom: `Sets each cat to be meowing or quiet at random.`,
    meowRandomRet: (x) => `${x} cat(s) are now meowing.`,

    feedRandom: `Feeds cats at random.`,
    feedRandomRet: (x) => `${x} cat(s) have been fed.`,

    checkAll: `Checks all possible cat configurations with the given layout.`,
    checkAllTooLarge: (size) =>
      `Checking ${size} condos will likely crash your computer, so it is not allowed yet.`,
    checkAllRetHeader: (count, time) =>
      `Checked ${count} configurations in ${time}ms. Found:`,
    checkAllRetRow: (configs, sols) =>
      `${configs} config(s) with ${sols} solution(s)`,

    copyOriginalId: `original`,
    copyOriginal: `Copies the original yarnball.`,
    copyOriginalRet: `Successfully copied original yarnball.`,

    copyUntangledId: `untangled`,
    copyUntangled: `Copies the untangled yarnball.`,
    copyUntangledRet: `Successfully copied untangled yarnball.`,
  },
  header: {
    solCount: (x, time) => `Solution count: ${x} (took ${time})`,
    original: `Original yarnball:`,
    untangled: `Untangled yarnball:`,
  },
} satisfies Transl
