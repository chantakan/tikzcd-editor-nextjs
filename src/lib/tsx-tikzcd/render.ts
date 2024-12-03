import { VNode } from './types'
import { Diagram, Node, Edge, Component } from './components'

interface RenderOptions {
    align?: boolean
    [key: string]: any
}

function resolveComponents(vnode: VNode | null): VNode | null {
    if (vnode == null) return null

    if (![Diagram, Node, Edge].includes(vnode.type)) {
        const props = { ...vnode.props, children: vnode.children }

        if (vnode.type.prototype instanceof Component) {
            return resolveComponents(new vnode.type(props).render())
        } else if (typeof vnode.type === 'function') {
            return resolveComponents(vnode.type(props))
        }
    }

    return {
        ...vnode,
        children: vnode.children.map(x => resolveComponents(x)).filter((x): x is VNode => x != null)
    }
}

export function renderToDiagram(vnode: VNode, options: RenderOptions = {}, co = false): Diagram | null {
    const diagramNode = resolveComponents(vnode)

    if (diagramNode == null || diagramNode.type !== Diagram)
        return null

    return new Diagram({
        ...diagramNode.props,
        co: co !== !!diagramNode.props.co,
        align: options.align ?? false,
        children: diagramNode.children
    })
}

export function render(vnode: VNode, options: RenderOptions = {}, co = false): string {
    const diagram = renderToDiagram(vnode, options, co)
    return diagram ? diagram.renderTeX() : ''
}

export function corender(vnode: VNode, options: RenderOptions = {}): string {
    return render(vnode, options, true)
} 