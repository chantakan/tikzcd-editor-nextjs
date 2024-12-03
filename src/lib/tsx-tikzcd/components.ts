import { VNode, DiagramProps, NodeProps, EdgeProps } from './types'

const needWrapChars = ['"', ',', ']']

function getDirection([x1, y1]: [number, number], [x2, y2]: [number, number]): string {
    const [dx, dy] = [x2 - x1, y2 - y1]
    const signs = [dx, dy].map(Math.sign)
    const directions = [['l', '', 'r'], ['u', '', 'd']]

    return [dx, dy].map((d, i) => directions[i][signs[i] + 1].repeat(Math.abs(d))).join('')
}

function renderEdge(vnode: VNode, co = false): string {
    const { direction, alt, value } = vnode.props
    if (direction == null) return ''

    let labelPosition = vnode.props.labelPosition || 'left'

    if (co === !alt && labelPosition !== 'inside') {
        labelPosition = labelPosition === 'left' ? 'right' : 'left'
    }

    const labelMap: Record<string, string> = {
        left: '',
        right: "'",
        inside: ' description'
    }
    const p = labelMap[labelPosition]

    const [w1, w2] = value != null
        && needWrapChars.some(c => value.includes(c))
        ? ['{', '}'] : ['', '']
    const valueArg = value != null ? `"${w1}${value}${w2}"${p}` : null
    const args = [direction ? '' : null, valueArg, ...(vnode.props.args || [])].filter(x => x != null).join(', ')

    return `\\arrow[${direction}${args}]`
}

export const Node = (_props: NodeProps): null => null
export const Edge = (_props: EdgeProps): null => null

export class Component<P = {}> {
    props: P

    constructor(props: P) {
        this.props = props
    }

    render(): VNode | null {
        return null
    }
}

export class Diagram extends Component<DiagramProps> {
    nodes: Record<string, VNode>
    edges: Record<string, VNode[]>

    constructor(props: DiagramProps) {
        super(props)

        const getChildren = (vnode: VNode): VNode[] => vnode.children.reduce((acc: VNode[], v) => {
            if (v == null) return acc

            if ([Node, Edge].includes(v.type)) {
                acc.push(v)
            } else {
                acc.push(...getChildren(v))
            }

            return acc
        }, [])

        const children = getChildren({ type: null, props: this.props, children: this.props.children || [] })

        this.nodes = children.reduce<Record<string, VNode>>((acc, v) => {
            if (v.type !== Node || !v.key || !v.props.position)
                return acc

            if (!(v.key in acc)) acc[v.key] = v
            else acc[v.key] = {
                ...acc[v.key],
                props: {
                    ...acc[v.key].props,
                    ...v.props
                }
            }

            return acc
        }, {})

        this.edges = children.reduce<Record<string, VNode[]>>((acc, v) => {
            if (v.type !== Edge || !v.props.from || !v.props.to)
                return acc

            const [from, to] = !props.co ? ['from', 'to'] : ['to', 'from']

            if (!(v.props[from] in acc)) acc[v.props[from]] = []

            acc[v.props[from]].push({
                ...v,
                props: {
                    ...v.props,
                    direction: getDirection(
                        this.nodes[v.props[from]].props.position,
                        this.nodes[v.props[to]].props.position
                    )
                }
            })

            return acc
        }, {})
    }

    getBounds(): [number, number, number, number] {
        return Object.keys(this.nodes)
            .map(key => this.nodes[key].props.position)
            .reduce(([minX, maxX, minY, maxY], [x, y]) => [
                Math.min(minX, x), Math.max(maxX, x),
                Math.min(minY, y), Math.max(maxY, y)
            ], [Infinity, -Infinity, Infinity, -Infinity])
    }

    toArray(): { node: VNode, edges: VNode[] }[][] {
        const [minX, maxX, minY, maxY] = this.getBounds()
        if (minX > maxX || minY > maxY) return []

        const diagram = Array(maxY - minY + 1).fill(null).map(() =>
            Array(maxX - minX + 1).fill(null)
        )

        for (const key of Object.keys(this.nodes)) {
            const [x, y] = this.nodes[key].props.position
            diagram[y - minY][x - minX] = {
                node: this.nodes[key],
                edges: this.edges[key] || []
            }
        }

        return diagram
    }

    renderTeX(): string {
        const options = this.props.options == null ? '' : `[${this.props.options}]`

        const cells = this.toArray().map(entries => entries.map(entry =>
            entry == null ? ''
                : [
                    (() => {
                        const value = entry.node.props.value || ''
                        const [w1, w2] = value.trim() === ''
                            || needWrapChars.some(c => value.includes(c))
                            ? ['{', '}'] : ['', '']

                        return `${w1}${value}${w2}`
                    })(),
                    ...entry.edges.map(e => renderEdge(e, this.props.co))
                ].join(' ')
        ))

        if (cells.flat().every(x => x === '')) {
            return [
                `\\begin{tikzcd}${options}`,
                cells.map(row => row.map(() => '{}')).join(' & '),
                '\\end{tikzcd}'
            ].join('\n')
        }

        if (this.props.align && cells.length > 0) {
            for (let j = 0; j < cells[0].length; j++) {
                const maxLength = Math.max(...cells.map(entries => entries[j].length))
                for (let i = 0; i < cells.length; i++) {
                    cells[i][j] = cells[i][j].padEnd(maxLength, ' ')
                }
            }
        }

        return [
            `\\begin{tikzcd}${options}`,
            cells.map(entries => entries.join(' & ')).join(' \\\\\n'),
            '\\end{tikzcd}'
        ].join('\n')
    }
} 