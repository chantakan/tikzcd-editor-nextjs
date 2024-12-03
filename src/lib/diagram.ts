import { Diagram as BaseDiagram, Node, Edge } from '../types/base'
import { h, render, Diagram, Node as TikzNode, Edge as TikzEdge } from './tsx-tikzcd'
import {
    compressToEncodedURIComponent,
    decompressFromEncodedURIComponent
} from 'lz-string'
import { getId, b64DecodeUnicode, b64EncodeUnicode } from './helper'
import { parse } from './parser'

export function toJSON(diagram: BaseDiagram): string {
    const leftTop = [0, 1].map(i =>
        diagram.nodes.reduce(
            (min, node) => Math.min(min, node.position[i]),
            Infinity
        )
    )

    return JSON.stringify({
        nodes: diagram.nodes.map(node => ({
            ...node,
            id: undefined,
            position: [
                node.position[0] - leftTop[0],
                node.position[1] - leftTop[1]
            ] as [number, number]
        })),
        edges: diagram.edges.map(edge => ({
            ...edge,
            from: diagram.nodes.findIndex(node => node.id === edge.from),
            to: diagram.nodes.findIndex(node => node.id === edge.to)
        }))
    })
}

export function fromJSON(json: string): BaseDiagram {
    const obj = JSON.parse(json)
    const nodes = obj.nodes.map((node: Omit<Node, 'id'>) => ({
        ...node,
        id: getId()
    }))

    return {
        nodes,
        edges: obj.edges.map((edge: any) => ({
            ...edge,
            from: nodes[edge.from].id,
            to: nodes[edge.to].id
        }))
    }
}

export function toBase64(diagram: BaseDiagram): string {
    return b64EncodeUnicode(toJSON(diagram))
}

export function fromBase64(base64: string): BaseDiagram {
    return fromJSON(b64DecodeUnicode(base64))
}

export function toCompressedBase64(diagram: BaseDiagram): string {
    return compressToEncodedURIComponent(toJSON(diagram))
}

export function fromCompressedBase64(compressed: string): BaseDiagram {
    return fromJSON(decompressFromEncodedURIComponent(compressed))
}

export function toTeX(diagram: BaseDiagram): string {
    return render(
        h(Diagram, null, [
            ...diagram.nodes.map(node => (
                h(TikzNode, {
                    key: node.id,
                    position: node.position,
                    value: node.value || ''
                })
            )),
            ...diagram.edges.map(edge => {
                const args = [
                    '',
                    edge.value != null ? `"${edge.value}"${edge.labelPosition === 'right' ? "'" :
                        edge.labelPosition === 'inside' ? ' description' : ''
                        }` : null,
                    ...[
                        edge.line,
                        edge.head,
                        edge.tail,
                        edge.labelPositionLongitudinal
                    ].map(id => ({
                        double: 'Rightarrow',
                        solid: null,
                        dashed: 'dashed',
                        dotted: 'dotted',
                        none: ['phantom', edge.line === 'none' ? null : 'no head', null],
                        default: null,
                        harpoon: 'harpoon',
                        harpoonalt: "harpoon'",
                        hook: 'hook',
                        hookalt: "hook'",
                        mapsto: 'maps to',
                        tail: 'tail',
                        twoheads: 'two heads',
                        center: null,
                        nearstart: 'near start',
                        nearend: 'near end',
                        verynearstart: 'very near start',
                        verynearend: 'very near end'
                    })[id as string] ?? null),
                    edge.bend != null ? (
                        edge.bend > 0
                            ? `bend left=${edge.bend}`.replace(/=30$/, '')
                            : edge.bend < 0
                                ? `bend right=${-edge.bend}`.replace(/=30$/, '')
                                : null
                    ) : null,
                    edge.shift != null ? (
                        edge.shift < 0
                            ? `shift left=${-edge.shift}`.replace(/=1$/, '')
                            : edge.shift > 0
                                ? `shift right=${edge.shift}`.replace(/=1$/, '')
                                : null
                    ) : null,
                    ...(edge.loop != null
                        ? (() => {
                            const [angle, clockwise] = edge.loop || [0, false]
                            let angles = [235, 305].map(
                                x => (x + angle + 360) % 360
                            )
                            const [inAngle, outAngle] = clockwise ? angles : [angles[1], angles[0]]
                            return [
                                'loop',
                                'distance=2em',
                                `in=${inAngle}`,
                                `out=${outAngle}`
                            ]
                        })()
                        : [])
                ].filter(x => x != null && x !== '');

                return h(TikzEdge, {
                    key: `${edge.from}-${edge.to}`,
                    from: edge.from,
                    to: edge.to,
                    args
                })
            })
        ]),
        { align: true }
    )
}

export function fromTeX(code: string): BaseDiagram {
    try {
        const parsed = parse(code)
        const nodes = parsed.nodes.map(node => ({
            ...node,
            id: getId()
        }))

        const edges = parsed.edges.map(edge => ({
            ...edge,
            from: nodes[edge.from].id,
            to: nodes[edge.to].id
        }))

        return { nodes, edges }
    } catch (err) {
        console.error('Parse error:', err)
        return { nodes: [], edges: [] }
    }
} 