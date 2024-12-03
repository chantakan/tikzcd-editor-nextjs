import { VNode } from './types'

export function h(type: any, props: any, ...children: any[]): VNode {
    const getChildren = (children: any[]): VNode[] => children.reduce((acc: VNode[], child) => {
        if (child instanceof Array) {
            acc.push(...getChildren(child))
        } else if (child != null) {
            acc.push(child)
        }

        return acc
    }, [])

    return {
        type,
        props: props || {},
        key: props && props.key,
        children: getChildren(children)
    }
} 