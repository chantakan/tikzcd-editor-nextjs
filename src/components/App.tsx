import React, { useCallback, useEffect, useState } from 'react'
import * as diagram from '../lib/diagram'
import { arrAdd, lexicalCompare } from '../lib/helper'
import { Diagram, Edge, GridMode } from '../types/base'

import Grid from './Grid'
import Properties from './Properties'
import Toolbox, { Button, Separator } from './Toolbox'
import CodeBox from './CodeBox'

interface AppState {
    tool: GridMode
    cellSize: number
    diagram: Diagram
    cameraPosition: [number, number]
    selectedCell: [number, number] | null
    selectedArrow: number | null
    cellEditMode: boolean
    confirmLinkCopy: boolean
    showCodeBox: boolean
    codeValue?: string
}

interface HistoryEntry {
    diagram: Diagram
    time: number
}

const App = () => {
    const [state, setState] = useState<AppState>({
        tool: 'pan',
        cellSize: 130,
        diagram: { nodes: [], edges: [] },
        cameraPosition: [-65, -65],
        selectedCell: [0, 0],
        selectedArrow: null,
        cellEditMode: false,
        confirmLinkCopy: false,
        showCodeBox: false
    })

    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [historyPointer, setHistoryPointer] = useState(0)
    const [prevTool, setPrevTool] = useState<GridMode | null>(null)

    useEffect(() => {
        const initialDiagram = parseDiagramFromUrl()
        setState(prev => ({ ...prev, diagram: initialDiagram }))
        setHistory([{ diagram: initialDiagram, time: Date.now() }])
    }, [])

    useEffect(() => {
        const toolControl: { [key: string]: GridMode } = {
            Shift: 'arrow',
            ' ': 'pan'
        }

        const arrowControl: { [key: string]: [number, number] } = {
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            ArrowUp: [0, -1],
            ArrowDown: [0, 1]
        }

        const handleKeyDown = (evt: KeyboardEvent) => {
            if (state.cellEditMode && toolControl[evt.key] != null) {
                return
            }

            if (toolControl[evt.key] != null) {
                if (prevTool != null) return

                setPrevTool(state.tool)
                setState(prev => ({
                    ...prev,
                    tool: toolControl[evt.key],
                    selectedArrow: toolControl[evt.key] === 'pan' ? null : prev.selectedArrow
                }))
            } else if (Object.keys(arrowControl).includes(evt.key)) {
                // Arrow keys
                setState(prev =>
                    prev.showCodeBox || prev.cellEditMode || prev.selectedArrow != null
                        ? prev
                        : {
                            ...prev,
                            selectedCell: arrAdd(
                                prev.selectedCell!,
                                arrowControl[evt.key]
                            ) as [number, number]
                        }
                )
            } else if (evt.key === 'Tab' && state.selectedArrow != null) {
                // Cycle through arrows
                evt.preventDefault()
                evt.stopPropagation()

                const diff = evt.shiftKey ? -1 : 1

                setState(prev => {
                    if (prev.selectedArrow == null) return prev

                    const { nodes, edges } = prev.diagram
                    const length = edges.length
                    const findNodePositionById = (id: string) =>
                        nodes.find(node => node.id === id)!.position

                    // Constructing a natural tab order for edges
                    const indices = [...Array(length)]
                        .map((_, i) => [
                            i,
                            [edges[i].from, edges[i].to]
                                .map(findNodePositionById)
                                .reduce((sum, x) => arrAdd(sum, x) as [number, number], [0, 0])
                        ])
                        .sort(([_, arr1], [__, arr2]) => lexicalCompare(arr1 as number[], arr2 as number[]))
                        .map(([i]) => i as number)

                    const metaIndex = indices.indexOf(prev.selectedArrow as number)

                    return {
                        ...prev,
                        selectedArrow:
                            indices[(((metaIndex + diff) % length) + length) % length]
                    }
                })
            } else if (evt.key === 'Enter' && !evt.shiftKey && !state.cellEditMode) {
                setState(prev => ({
                    ...prev,
                    cellEditMode: prev.selectedCell !== null
                }))
            } else if (evt.key === 'Escape') {
                setState(prev => ({
                    ...prev,
                    cellEditMode: false,
                    selectedCell: null,
                    selectedArrow: null
                }))
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [state.cellEditMode])

    useEffect(() => {
        console.log('Selected Arrow State:', state.selectedArrow)
    }, [state.selectedArrow])

    const parseDiagramFromUrl = useCallback((): Diagram => {
        if (typeof window === 'undefined') return { nodes: [], edges: [] }

        if (window.location.hash.length > 0) {
            try {
                return diagram.fromCompressedBase64(window.location.hash.slice(1))
            } catch (err) { }

            try {
                return diagram.fromBase64(window.location.hash.slice(1))
            } catch (err) {
                alert('Invalid diagram permalink.')
            }
        }

        return { nodes: [], edges: [] }
    }, [])

    const resetCamera = useCallback(() => {
        setState(prev => ({
            ...prev,
            cameraPosition: Array(2).fill(-Math.floor(prev.cellSize / 2)) as [number, number],
            selectedCell: [0, 0],
            selectedArrow: null
        }))
    }, [])

    const handlePan = useCallback(({ cameraPosition }: { cameraPosition: [number, number] }) => {
        setState(prev => ({ ...prev, cameraPosition }))
    }, [])

    const generateLink = useCallback(() => {
        const encoded = diagram.toCompressedBase64(state.diagram)
        const base = window.location.href.split('#')[0]
        return base + '#' + encoded
    }, [state.diagram])

    const copyLink = useCallback(async () => {
        if (state.confirmLinkCopy) return

        const url = generateLink()
        window.history.pushState(null, '', url)

        try {
            await navigator.clipboard.writeText(url)
            setState(prev => ({ ...prev, confirmLinkCopy: true }))
            setTimeout(() => setState(prev => ({ ...prev, confirmLinkCopy: false })), 1000)
        } catch {
            prompt('Copy link down below:', url)
        }
    }, [generateLink, state.confirmLinkCopy])

    const openCodeBox = useCallback(() => {
        const code = `% ${generateLink()}\n${diagram.toTeX(state.diagram)}`
        setState(prev => ({
            ...prev,
            codeValue: code,
            showCodeBox: true,
            selectedArrow: null
        }))
    }, [generateLink, state.diagram])

    const handleCloseCodeBox = useCallback(() => {
        setState(prev => ({ ...prev, showCodeBox: false }))
    }, [])

    const handleCodeInput = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = evt.currentTarget.value
        setState(prev => ({
            ...prev,
            codeValue: newValue
        }))
    }, [])

    const handleParseCode = useCallback(() => {
        const currentCode = diagram.toTeX(state.diagram)
        const newCode = state.codeValue
        if (!newCode || currentCode === newCode) return

        try {
            console.log('Parsing TeX:', {
                input: newCode,
                currentCode
            })
            const data = diagram.fromTeX(newCode)
            console.log('Parsed result:', {
                nodes: data.nodes,
                edges: data.edges
            })
            resetCamera()
            setState(prev => ({
                ...prev,
                showCodeBox: false,
                diagram: data
            }))
        } catch (err: unknown) {
            const error = err as Error
            console.error('Parse error:', error)
            alert(`Could not parse code.\n\nReason: ${error.message}`)
        }
    }, [state.diagram, state.codeValue, resetCamera])

    const handleDataChange = useCallback(({ selectedCell, selectedArrow, data }: {
        selectedCell?: [number, number]
        selectedArrow?: number | null
        data: Diagram
    }) => {
        setState(prev => {
            const edgeAdded = prev.diagram.edges.length + 1 === data.edges.length
            return {
                ...prev,
                diagram: data,
                selectedArrow: edgeAdded ? data.edges.length - 1 : selectedArrow ?? prev.selectedArrow,
                ...(selectedCell ? {
                    selectedCell,
                    selectedArrow: null
                } : {}),
                cellEditMode: false,
                tool: prev.tool
            }
        })

        const historyEntry = { diagram: data, time: Date.now() }

        setHistory(prev => {
            if (
                (historyPointer < prev.length - 1 ||
                    Date.now() - prev[historyPointer].time > 500) &&
                prev[historyPointer].diagram !== data
            ) {
                const newHistory = [
                    ...prev.slice(0, historyPointer + 1),
                    historyEntry
                ]
                setHistoryPointer(newHistory.length - 1)
                return newHistory
            } else {
                const newHistory = [...prev]
                newHistory[historyPointer] = historyEntry
                return newHistory
            }
        })
    }, [historyPointer])

    const handleCellClick = useCallback(({ position }: { position: [number, number] }) => {
        setState(prev => ({
            ...prev,
            selectedCell: position,
            selectedArrow: null,
            cellEditMode: true
        }))
    }, [])

    const handleCellSubmit = useCallback(() => {
        setState(prev => ({
            ...prev,
            cellEditMode: false,
        }))
    }, [])

    const handleArrowClick = useCallback(({ edge }: { edge: number | null }) => {
        setState(prev => ({
            ...prev,
            selectedArrow: prev.selectedArrow === edge ? null : edge,
            cellEditMode: false,
            tool: prev.tool
        }))
    }, [])

    const handleEdgeChange = useCallback(({ data: edgeData }: { data: Partial<Edge> }) => {
        setState(prev => {
            const newEdges = [...prev.diagram.edges]
            if (prev.selectedArrow === null) return prev

            newEdges[prev.selectedArrow] = {
                ...newEdges[prev.selectedArrow],
                ...edgeData
            }

            if (edgeData.value != null && edgeData.value.trim() === '') {
                delete newEdges[prev.selectedArrow].value
            }

            return {
                ...prev,
                diagram: {
                    nodes: prev.diagram.nodes,
                    edges: newEdges
                }
            }
        })
    }, [])

    const handleEdgeRemoveClick = useCallback(() => {
        setState(prev => {
            if (prev.selectedArrow === null) return prev

            const newEdges = prev.diagram.edges.filter(
                (_, i) => i !== prev.selectedArrow
            )

            const newNodes = prev.diagram.nodes.filter(
                n =>
                    n.value.trim() !== '' ||
                    newEdges.some(e => e.from === n.id || e.to === n.id)
            )

            return {
                ...prev,
                selectedArrow: null,
                diagram: {
                    nodes: newNodes,
                    edges: newEdges
                }
            }
        })
    }, [])

    const handleToolClick = useCallback((tool: 'pan' | 'arrow') => {
        setState(prev => ({
            ...prev,
            tool,
            selectedArrow: tool === 'pan' ? null : prev.selectedArrow,
            cellEditMode: false,
            selectedCell: null
        }))
    }, [])

    const handleUndo = useCallback(() => {
        if (historyPointer <= 0) return
        setHistoryPointer(prev => prev - 1)
        setState(prev => ({
            ...prev,
            diagram: history[historyPointer - 1].diagram,
            selectedArrow: null
        }))
    }, [history, historyPointer])

    const handleRedo = useCallback(() => {
        if (historyPointer >= history.length - 1) return
        setHistoryPointer(prev => prev + 1)
        setState(prev => ({
            ...prev,
            diagram: history[historyPointer + 1].diagram,
            selectedArrow: null
        }))
    }, [history, historyPointer])

    return (
        <div id="root">
            <Grid
                cellSize={state.cellSize}
                cameraPosition={state.cameraPosition}
                data={state.diagram}
                mode={state.tool}
                selectedCell={state.selectedArrow == null ? state.selectedCell : null}
                selectedArrow={state.selectedArrow}
                cellEditMode={state.cellEditMode}
                onPan={handlePan}
                onDataChange={handleDataChange}
                onCellClick={handleCellClick}
                onCellSubmit={handleCellSubmit}
                onArrowClick={handleArrowClick}
            />

            <Properties
                edgeId={state.selectedArrow ?? undefined}
                show={state.selectedArrow != null}
                data={state.diagram.edges[state.selectedArrow ?? 0]}
                onChange={handleEdgeChange}
                onRemoveClick={handleEdgeRemoveClick}
            />

            <Toolbox id="toolbox">
                <Button
                    checked={state.tool === 'pan'}
                    icon="./img/tools/pan.svg"
                    name="Pan Tool (Space)"
                    onClick={() => handleToolClick('pan')}
                />

                <Button
                    checked={state.tool === 'arrow'}
                    icon="./img/tools/arrow.svg"
                    name="Arrow Tool (Shift)"
                    onClick={() => handleToolClick('arrow')}
                />

                <Separator />

                <Button
                    disabled={historyPointer <= 0}
                    icon="./img/tools/undo.svg"
                    name="Undo"
                    onClick={handleUndo}
                />

                <Button
                    disabled={historyPointer >= history.length - 1}
                    icon="./img/tools/redo.svg"
                    name="Redo"
                    onClick={handleRedo}
                />

                <Separator />

                <Button
                    checked={state.showCodeBox}
                    icon="./img/tools/code.svg"
                    name="Open Code"
                    onClick={openCodeBox}
                />

                <Button
                    icon={`./img/tools/${state.confirmLinkCopy ? 'tick' : 'link'}.svg`}
                    name="Copy Diagram Permalink"
                    onClick={copyLink}
                />

                <Separator />

                <Button
                    icon="./img/tools/about.svg"
                    name="GitHub Repository"
                    onClick={() => {
                        window.open('https://github.com/chantakan/tikzcd-editor-nextjs', '_blank')
                    }}
                />
            </Toolbox>

            <CodeBox
                code={state.codeValue}
                show={state.showCodeBox}
                onCodeInput={handleCodeInput}
                onParseButtonClick={handleParseCode}
                onClose={handleCloseCodeBox}
            />
        </div>
    )
}

export default App 