import { BaseNode, BaseEdge } from '../../types/base'

export interface VNode {
    type: any
    props: {
        [key: string]: any
        children?: VNode[]
    }
    key?: string
    children: VNode[]
}

export interface DiagramProps {
    co?: boolean
    align?: boolean
    options?: string
    children?: VNode[]
}

export interface NodeProps extends BaseNode {
    key: string
    position: [number, number]
    value: string
}

export interface EdgeProps extends BaseEdge {
    from: string
    to: string
    value?: string
    labelPosition?: 'left' | 'right' | 'inside'
    args?: (string | null)[]
    direction?: string
    alt?: boolean
}
