import React, { useEffect, useRef, useState, useCallback } from 'react'
import { getId, arrEquals, arrSubtract, arrScale, arrAdd } from '../lib/helper'
import { Diagram, Node, Edge, GridMode } from '../types/base'

import GridCell from './GridCell'
import GridArrow from './GridArrow'

interface GridProps {
    cellSize: number
    cameraPosition: [number, number]
    data: Diagram
    mode: GridMode
    selectedCell: [number, number] | null
    selectedArrow: number | null
    cellEditMode: boolean
    onPan?: (data: { cameraPosition: [number, number] }) => void
    onDataChange?: (params: {
        selectedCell?: [number, number]
        selectedArrow?: number | null
        data: Diagram
        cellEditMode?: boolean
    }) => void
    onCellClick?: (data: { position: [number, number] }) => void
    onCellSubmit?: () => void
    onArrowClick?: (data: { edge: number | null }) => void
    onToolChange?: (mode: GridMode) => void
}

interface GridState {
    width: number
    height: number
    phantomArrow: {
        from: [number, number]
        to: [number, number]
    } | null
    movingNodePosition: [number, number] | null
    cellTypesetSizes: {
        [key: string]: [number, number]
    }
}

const Grid: React.FC<GridProps> = ({
    cellSize,
    cameraPosition,
    data,
    mode,
    selectedCell,
    selectedArrow,
    cellEditMode,
    onPan,
    onDataChange,
    onCellClick,
    onCellSubmit,
    onArrowClick,
    onToolChange
}) => {
    const [state, setState] = useState<GridState>({
        width: 0,
        height: 0,
        phantomArrow: null,
        movingNodePosition: null,
        cellTypesetSizes: {}
    })

    const gridRef = useRef<HTMLElement>(null)
    const pointerDownRef = useRef<{
        evt: MouseEvent
        cameraPosition: [number, number]
        position: [number, number]
        mode: GridMode
        nodeIndex?: number
    } | null>(null)

    const phantomArrowRef = useRef<{
        from: [number, number]
        to: [number, number]
    } | null>(null)

    const isUpdatingRef = useRef(false)

    const commitPhantomArrow = useCallback(() => {
        if (isUpdatingRef.current) return
        isUpdatingRef.current = true

        setState(prev => {
            isUpdatingRef.current = false
            return {
                ...prev,
                phantomArrow: phantomArrowRef.current
            }
        })
    }, [])

    useEffect(() => {
        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    const coordsToPosition = (mouseCoords: [number, number]): [number, number] => {
        return mouseCoords.map((x, i) =>
            Math.floor((x + cameraPosition[i]) / cellSize)
        ) as [number, number]
    }

    const handleArrowCreation = useCallback((fromPosition: [number, number], toPosition: [number, number]) => {
        if (arrEquals(fromPosition, toPosition)) {
            return
        }

        const newNodes = [...data.nodes]
        let [fromNode, toNode] = [fromPosition, toPosition].map(position =>
            newNodes.find(n => arrEquals(n.position, position))
        )

        if (!fromNode) {
            fromNode = { id: getId(), position: fromPosition, value: '' }
            newNodes.push(fromNode)
        }
        if (!toNode) {
            toNode = { id: getId(), position: toPosition, value: '' }
            newNodes.push(toNode)
        }

        const newEdge: Edge = {
            from: fromNode.id,
            to: toNode.id,
            line: 'solid',
            head: 'default'
        }

        onDataChange?.({
            data: {
                nodes: newNodes,
                edges: [...data.edges, newEdge]
            },
            selectedArrow: data.edges.length
        })
    }, [data, onDataChange])

    const handlePointerMove = useCallback((evt: PointerEvent) => {
        if (cellEditMode || !pointerDownRef.current) {
            pointerDownRef.current = null
            setState(prev => ({
                ...prev,
                phantomArrow: null,
                movingNodePosition: null
            }))
            return
        }

        evt.preventDefault()
        const newPosition = coordsToPosition([evt.clientX, evt.clientY])

        if (pointerDownRef.current.mode === 'move') {
            const nodeIndex = pointerDownRef.current.nodeIndex ?? -1
            if (nodeIndex < 0) return

            const existingNode = data.nodes.find(n =>
                arrEquals(n.position, newPosition)
            )
            if (existingNode != null) return

            setState(prev => ({
                ...prev,
                movingNodePosition: newPosition
            }))

            onDataChange?.({
                selectedCell: newPosition,
                data: {
                    nodes: data.nodes.map((x, i) =>
                        i !== nodeIndex ? x : { ...x, position: newPosition }
                    ),
                    edges: data.edges
                }
            })
        } else if (pointerDownRef.current.mode === 'arrow') {
            const from = pointerDownRef.current.position
            setState(prev => ({
                ...prev,
                phantomArrow: !arrEquals(from, newPosition) ? { from, to: newPosition } : null
            }))
        } else if (pointerDownRef.current.mode === 'pan') {
            const oldEvt = pointerDownRef.current.evt
            const movement = arrSubtract(
                [evt.clientX, evt.clientY],
                [oldEvt.clientX, oldEvt.clientY]
            )
            onPan?.({
                cameraPosition: arrSubtract(pointerDownRef.current.cameraPosition, movement) as [number, number]
            })
        }
    }, [coordsToPosition, onPan, cellEditMode, data.nodes, onDataChange])

    const handlePointerUp = useCallback((evt: PointerEvent) => {
        const pointerDown = pointerDownRef.current
        if (!pointerDown) return

        if (pointerDown.mode === 'arrow' && state.phantomArrow) {
            const { from, to } = state.phantomArrow
            if (!arrEquals(from, to)) {
                handleArrowCreation(from, to)
            }
        }

        setState(prev => ({
            ...prev,
            phantomArrow: null,
            movingNodePosition: null
        }))
        pointerDownRef.current = null
    }, [handleArrowCreation, state.phantomArrow])

    useEffect(() => {
        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp)
        return () => {
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerup', handlePointerUp)
        }
    }, [handlePointerMove, handlePointerUp])

    const updateSize = () => {
        if (!gridRef.current) return
        const { width, height } = gridRef.current.getBoundingClientRect()
        setState(prev => ({ ...prev, width, height }))
    }

    const getViewportRect = () => {
        return {
            width: state.width,
            height: state.height,
            left: cameraPosition[0],
            top: cameraPosition[1]
        }
    }

    const positionToRect = ([x, y]: [number, number]) => {
        return {
            width: cellSize,
            height: cellSize,
            left: x * cellSize,
            top: y * cellSize
        }
    }

    const panCellIntoView = (position: [number, number]) => {
        const cellRect = positionToRect(position)
        const viewportRect = getViewportRect()
        let [cx, cy] = cameraPosition

        if (cellRect.left < viewportRect.left) {
            cx = cellRect.left
        } else if (
            cellRect.left + cellRect.width >
            viewportRect.left + viewportRect.width
        ) {
            cx = cellRect.left + cellRect.width - viewportRect.width
        }

        if (cellRect.top < viewportRect.top) {
            cy = cellRect.top
        } else if (
            cellRect.top + cellRect.height >
            viewportRect.top + viewportRect.height
        ) {
            cy = cellRect.top + cellRect.height - viewportRect.height
        }

        onPan?.({ cameraPosition: [cx, cy] })
    }

    const handleNodePointerDown = useCallback((evt: React.PointerEvent<HTMLElement>) => {
        console.log('handleNodePointerDown', {
            mode,
            cellEditMode,
            selectedArrow,
            loop: selectedArrow !== null ? data.edges[selectedArrow]?.loop : null
        })

        if (evt.button !== 0 || cellEditMode) return

        const position = coordsToPosition([evt.clientX, evt.clientY])

        if (mode === 'arrow') {
            console.log('arrow mode - creating phantom arrow')
            pointerDownRef.current = {
                evt: evt.nativeEvent as unknown as MouseEvent,
                position,
                mode: 'arrow',
                cameraPosition
            }

            setState(prev => ({
                ...prev,
                phantomArrow: {
                    from: position,
                    to: position
                }
            }))
            return
        }

        if (mode === 'pan') {
            onArrowClick?.({ edge: null })
            pointerDownRef.current = {
                evt: evt.nativeEvent as unknown as MouseEvent,
                position,
                mode: 'pan',
                cameraPosition
            }
        }
    }, [mode, cameraPosition, coordsToPosition, onArrowClick, cellEditMode])

    const handleNodePointerUp = (evt: React.PointerEvent<HTMLElement>) => {
        const pointerDown = pointerDownRef.current
        if (pointerDown == null) return

        const oldEvt = pointerDown.evt
        if (evt.clientX !== oldEvt.clientX || evt.clientY !== oldEvt.clientY) return

        const { position } = pointerDown
        onCellClick?.({ position })
    }

    const handleCellChange = (evt: { position: [number, number]; value: string }) => {
        console.log('Grid handleCellChange:', evt)
        let nodes = [...data.nodes]
        const index = nodes.findIndex(n => arrEquals(n.position, evt.position))

        if (index < 0) {
            if (evt.value.trim() !== '') {
                nodes.push({
                    id: getId(),
                    position: evt.position,
                    value: evt.value
                })
            }
        } else {
            const { id } = nodes[index]
            nodes[index] = { id, position: [...evt.position], value: evt.value }

            if (evt.value.trim() === '') {
                // Cleanup if necessary
                const existingEdge = data.edges.find(
                    e => e.from === id || e.to === id
                )
                if (!existingEdge) nodes[index] = null as unknown as Node
            }
        }

        onDataChange?.({
            data: {
                nodes: nodes.filter((x): x is Node => x != null),
                edges: data.edges
            }
        })
    }

    const handleTypesetFinish = useCallback((evt: {
        position: [number, number]
        element: Element | null
    }) => {
        const key = evt.position.join(',')
        const newSize = evt.element
            ? [evt.element.getBoundingClientRect().width, evt.element.getBoundingClientRect().height] as [number, number]
            : undefined

        setState(prev => {
            // 前の状態と同じなら更新しない
            if (newSize && prev.cellTypesetSizes[key]?.[0] === newSize[0] &&
                prev.cellTypesetSizes[key]?.[1] === newSize[1]) {
                return prev
            }

            if (!newSize) {
                if (!prev.cellTypesetSizes[key]) return prev
                const newSizes = { ...prev.cellTypesetSizes }
                delete newSizes[key]
                return { ...prev, cellTypesetSizes: newSizes }
            }

            return {
                ...prev,
                cellTypesetSizes: {
                    ...prev.cellTypesetSizes,
                    [key]: newSize
                }
            }
        })
    }, [])

    const handleCellAddLoopClick = useCallback((evt: React.MouseEvent<HTMLImageElement>) => {
        if (evt.button !== 0) return
        evt.stopPropagation()

        let newNodes = [...data.nodes]
        let position = coordsToPosition([evt.clientX, evt.clientY])
        let node = newNodes.find(n => arrEquals(n.position, position))

        if (node == null) {
            node = {
                id: getId(),
                position,
                value: ''
            }
            newNodes.push(node)
        }

        let newEdges = [
            ...data.edges,
            {
                from: node.id,
                to: node.id,
                loop: [0, false] as [number, boolean],
                labelPosition: 'right' as 'left' | 'right' | 'inside'
            }
        ]

        onDataChange?.({
            data: { nodes: newNodes, edges: newEdges },
            selectedArrow: newEdges.length - 1
        })

        if (mode === 'arrow') {
            evt.preventDefault()
        }
    }, [data.nodes, coordsToPosition, onDataChange, mode])

    // キャッシュを追加
    const edgeClickHandlersCache = useRef<{
        [key: number]: (evt: React.MouseEvent<HTMLLIElement>) => void
    }>({})

    // handleArrowClickをsrc2と同様に修正
    const handleArrowClick = useCallback((index: number) => {
        if (edgeClickHandlersCache.current[index] == null) {
            edgeClickHandlersCache.current[index] = evt => {
                evt.preventDefault()
                evt.stopPropagation()
                onArrowClick?.({ edge: index })
            }
        }

        return edgeClickHandlersCache.current[index]
    }, [onArrowClick])

    const handleCellGrabberPointerDown = useCallback((evt: React.PointerEvent<HTMLElement>) => {
        if (evt.button !== 0) return
        evt.stopPropagation()

        const position = coordsToPosition([evt.clientX, evt.clientY])
        const nodeIndex = data.nodes.findIndex(n => arrEquals(n.position, position))

        pointerDownRef.current = {
            evt: evt.nativeEvent as unknown as MouseEvent,
            position,
            mode: 'move',
            cameraPosition,
            nodeIndex
        }

        setState(prev => ({
            ...prev,
            movingNodePosition: position
        }))
    }, [coordsToPosition, cameraPosition, data.nodes])

    // レンダリング部分の実装
    const size = [state.width, state.height]
    const [xstart, ystart] = cameraPosition.map(x => Math.floor(x / cellSize))
    const [xend, yend] = cameraPosition.map((x, i) =>
        Math.floor((x + size[i]) / cellSize)
    )
    const [cols, rows] = [xend - xstart + 1, yend - ystart + 1]
    const [tx, ty] = arrSubtract(
        arrScale(cellSize, [xstart, ystart]),
        cameraPosition
    )

    useEffect(() => {
        if (cellEditMode) {
            pointerDownRef.current = null
            setState(prev => ({
                ...prev,
                phantomArrow: null,
                movingNodePosition: null
            }))
        }
    }, [cellEditMode])

    return (
        <section
            ref={gridRef}
            id="grid"
            className={mode}
        >
            <ol
                style={{
                    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
                    left: tx,
                    top: ty,
                    width: cols * cellSize,
                    height: rows * cellSize
                }}
                onPointerDown={handleNodePointerDown}
                onPointerUp={handleNodePointerUp}
            >
                {Array(rows)
                    .fill(null)
                    .map((_, j) =>
                        Array(cols)
                            .fill(null)
                            .map((_, i) => [i + xstart, j + ystart] as [number, number])
                            .map(position => {
                                const selected =
                                    selectedCell != null &&
                                    arrEquals(position, selectedCell)

                                const node = data.nodes.find(n =>
                                    arrEquals(n.position, position)
                                )

                                return (
                                    <GridCell
                                        key={position.join(',')}
                                        position={position}
                                        size={cellSize}
                                        selected={selected}
                                        moving={
                                            state.movingNodePosition != null &&
                                            arrEquals(position, state.movingNodePosition)
                                        }
                                        edit={selected && cellEditMode}
                                        value={node?.value}
                                        onGrabberPointerDown={handleCellGrabberPointerDown}
                                        onSubmit={onCellSubmit}
                                        onChange={handleCellChange}
                                        onTypesetFinish={handleTypesetFinish}
                                        mode={mode}
                                        onAddLoopClick={handleCellAddLoopClick}
                                    />
                                )
                            })
                    )}
            </ol>

            <ul
                style={{
                    left: -cameraPosition[0],
                    top: -cameraPosition[1]
                }}
            >
                {data.edges.map((edge, i) => {
                    const fromPosition = data.nodes.find(n => n.id === edge.from)?.position
                    const toPosition = data.nodes.find(n => n.id === edge.to)?.position

                    if (!fromPosition || !toPosition) return null

                    return (
                        <GridArrow
                            key={i}
                            cellSize={cellSize}
                            id={i.toString()}
                            from={fromPosition}
                            to={toPosition}
                            fromSize={state.cellTypesetSizes[fromPosition.join(',')]}
                            toSize={state.cellTypesetSizes[toPosition.join(',')]}
                            selected={selectedArrow === i}
                            bend={edge.bend}
                            shift={edge.shift}
                            loop={edge.loop}
                            tail={edge.tail}
                            line={edge.line}
                            head={edge.head}
                            value={edge.value}
                            labelPosition={edge.labelPosition}
                            onClick={handleArrowClick(i)}  // キャッシュされたハンドラを使用
                        />
                    )
                })}

                {state.phantomArrow && (
                    <GridArrow
                        cellSize={cellSize}
                        phantom
                        from={state.phantomArrow.from}
                        to={state.phantomArrow.to}
                        fromSize={
                            state.cellTypesetSizes[state.phantomArrow.from.join(',')]
                        }
                        toSize={state.cellTypesetSizes[state.phantomArrow.to.join(',')]}
                    />
                )}
            </ul>
        </section>
    )
}

export default Grid 