export interface Node {
    id: string
    position: [number, number]
    value: string
}

export interface Edge {
    from: string
    to: string
    value?: string
    labelPosition?: 'left' | 'right' | 'inside'
    line?: string
    head?: string | null
    tail?: string
    bend?: number
    shift?: number
    loop?: [number, boolean]
    labelPositionLongitudinal?: string
}

export interface Diagram {
    nodes: Node[]
    edges: Edge[]
}

export interface Position {
    x: number
    y: number
} 