const PUBLIC_PATH = '/img'

export const IMAGES = {
    TOOLS: {
        PAN: `${PUBLIC_PATH}/tools/pan.svg`,
        ARROW: `${PUBLIC_PATH}/tools/arrow.svg`,
        UNDO: `${PUBLIC_PATH}/tools/undo.svg`,
        REDO: `${PUBLIC_PATH}/tools/redo.svg`,
        CODE: `${PUBLIC_PATH}/tools/code.svg`,
        LINK: `${PUBLIC_PATH}/tools/link.svg`,
        TICK: `${PUBLIC_PATH}/tools/tick.svg`,
        ABOUT: `${PUBLIC_PATH}/tools/about.svg`,
        BLANK: `${PUBLIC_PATH}/tools/blank.svg`
    },
    PROPERTIES: {
        SOLID: `${PUBLIC_PATH}/properties/solid.svg`,
        DASHED: `${PUBLIC_PATH}/properties/dashed.svg`,
        DOTTED: `${PUBLIC_PATH}/properties/dotted.svg`,
        DOUBLE: `${PUBLIC_PATH}/properties/double.svg`,
        TAIL: `${PUBLIC_PATH}/properties/tail.svg`,
        HEAD: `${PUBLIC_PATH}/properties/head.svg`,
        HOOK: `${PUBLIC_PATH}/properties/hook.svg`,
        HOOKALT: `${PUBLIC_PATH}/properties/hookalt.svg`,
        TWOHEADS: `${PUBLIC_PATH}/properties/twoheads.svg`,
        LABELLEFT: `${PUBLIC_PATH}/properties/labelleft.svg`,
        LABELRIGHT: `${PUBLIC_PATH}/properties/labelright.svg`,
        LABELINSIDE: `${PUBLIC_PATH}/properties/labelinside.svg`,
        EDIT: `${PUBLIC_PATH}/properties/edit.svg`,
        TRASH: `${PUBLIC_PATH}/properties/trash.svg`
    },
    ARROW: {
        getPath: (type: string, isDouble: boolean = false) =>
            `${PUBLIC_PATH}/arrow/${isDouble ? 'double-' : ''}${type}.svg`
    },
    MISC: {
        GRABBER: `${PUBLIC_PATH}/grabber.svg`,
        LOOP: `${PUBLIC_PATH}/loop.svg`
    }
} 