type Transl = {
  [x: string]: string | ((...args: (string | number)[]) => string) | Transl
}

const transls1 = {
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
    checkAllEarlyExit: (count, sols) =>
      `All ${count} configurations are satiable. Each has ${sols} solution(s).`,

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

const transls2: typeof transls1 = {
  condoDoesNotExist: (id) => `Participant ${id} does not exist.`,
  helpMain: `Each numbered circle above is a participant. Dark blue participants are currently muted.
Right-click a participant to execute a mute move on them. Doing that on all participants with a black ring should unmute everyone.
A participant's number is their ID. These are used when typing commands.
Use 0 as an ID to create a new participant. Use * as an ID to match all participants.
You can drag an individual participant, or the entire meeting.
Dragging one participant very far out, then releasing, often creates a less chaotic participant arrangement, visually.
Scroll with a mouse or pinch on a trackpad to zoom.`,
  cmd: {
    new: "Creates a new participant.",
    newRet: (x) => `Created participant ${x} (unmuted).`,
    link: "Links multiple participants in a chain.",
    linkShorthand:
      "Links participants in a chain; if all links are already present, removes those links.",
    rm: "Removes one or more participants.",
    rmRet: (x) => `Removed #${x}.`,

    unlink: `Removes all links to the passed participant.`,
    unlinkRet0: (x) => `${x} is already isolated.`,
    unlinkRet: (x) => `Removed ${x} connection(s).`,

    cycle: `Creates a cycle ending at some participant.`,
    rect: `Creates a rectangle with a corner at some participant.`,
    chain: `Creates a chain starting at some participant.`,

    linkCycle: `Links multiple participants into a cycle.`,
    linkEvery: `Creates all possible links between the given participants.`,
    linkToAll: `Links each passed participant to EVERY other participant.`,

    meowId: `mute`,
    meowDesc: `Invoke the targeted evil of the Zoom AI to mute one or more participants.`,
    meowRetAlready: (x) => `${x} is already muted.`,
    meowRetOn: (x) => `Forcefully muted participant ${x}.`,

    hushId: `unmute`,
    hushDesc: `Use the benevolence of the Zoom AI to unmute one or more participants.`,
    hushRetAlready: (x) => `${x} is already unmuted.`,
    hushRetOn: (x) => `Forcefully unmuted participant ${x}.`,

    feedId: `mm`,
    feedDesc: `Executes a mute move on one or more participants.`,
    feedRet: (x) => `Executed a mute move on ${x}.`,

    meowRandom: `Sets each participant to be muted or unmuted at random.`,
    meowRandomRet: (x) => `${x} participant(s) are now muted.`,

    feedRandom: `Executes mute moves at random.`,
    feedRandomRet: (x) => `${x} mute moves have been executed.`,

    checkAll: `Checks all possible meeting configurations with the given layout.`,
    checkAllTooLarge: (size) =>
      `Checking ${size} participants will likely crash your computer, so it is not allowed yet.`,
    checkAllRetHeader: (count, time) =>
      `Checked ${count} configurations in ${time}ms. Found:`,
    checkAllRetRow: (configs, sols) =>
      `${configs} config(s) with ${sols} solution(s)`,
    checkAllEarlyExit: (count, sols) =>
      `All ${count} configurations are satiable. Each has ${sols} solution(s).`,

    copyOriginalId: `original`,
    copyOriginal: `Copies the original Kevin stack.`,
    copyOriginalRet: `Successfully copied the original Kevin stack.`,

    copyUntangledId: `polarized`,
    copyUntangled: `Copies the polarized Kevin stack.`,
    copyUntangledRet: `Successfully copied the polarized Kevin stack.`,
  },
  header: {
    solCount: (x, time) => `Solution count: ${x} (took ${time})`,
    original: `Original Kevin stack:`,
    untangled: `Polarized Kevin stack:`,
  },
}

export let transls: typeof transls1

try {
  transls = TRANSL == 1 ? transls1 : transls2
} catch (e) {
  transls = transls1
}

declare var TRANSL: 1 | 2
