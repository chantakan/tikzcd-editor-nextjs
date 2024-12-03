// 共通の基本型を定義
export interface BasePosition {
    position: [number, number]
}

export interface BaseNode extends BasePosition {
    value: string
}

export interface BaseEdge {
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

// アプリケーション全体で使用する具体的な型
export interface Node extends BaseNode {
    id: string
}

export interface Edge extends BaseEdge {
    from: string
    to: string
}

export interface Diagram {
    nodes: Node[]
    edges: Edge[]
}

// モードの型を拡張
export type GridMode = 'pan' | 'arrow' | 'move'; 