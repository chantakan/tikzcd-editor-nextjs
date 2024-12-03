import React, { useEffect, useRef, useCallback, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { GridMode } from '../types/base'

interface GridCellProps {
    position: [number, number]
    size: number
    selected?: boolean
    moving?: boolean
    edit?: boolean
    value?: string
    onGrabberPointerDown?: (evt: React.PointerEvent<HTMLImageElement>) => void
    onAddLoopClick?: (evt: React.MouseEvent<HTMLImageElement>) => void
    onSubmit?: (data: { position: [number, number] }) => void
    onChange?: (data: { position: [number, number], value: string }) => void
    onTypesetFinish?: (data: {
        position: [number, number]
        element: Element | null
    }) => void
    mode: GridMode
}

const GridCell: React.FC<GridCellProps> = ({
    position,
    size,
    selected = false,
    moving = false,
    edit = false,
    value = '',
    onGrabberPointerDown,
    onAddLoopClick,
    onSubmit,
    onChange,
    onTypesetFinish,
    mode
}) => {
    const valueRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [inputValue, setInputValue] = useState(value)

    useEffect(() => {
        const container = valueRef.current
        if (!container) return

        // 数式をレンダリング
        const renderMath = () => {
            try {
                // 既存の内容をクリア
                container.innerHTML = ''

                if (!value.trim()) {
                    const span = document.createElement('span')
                    span.className = 'opacity-0'
                    span.textContent = '_'
                    container.appendChild(span)
                    onTypesetFinish?.({
                        position,
                        element: null
                    })
                    return
                }

                // KaTeXで数式をレンダリング
                katex.render(value, container, {
                    throwOnError: false,
                    displayMode: false,
                    strict: false,
                    trust: true,
                    macros: {
                        '\\to': '\\rightarrow',
                        '\\implies': '\\Rightarrow'
                    }
                })

                onTypesetFinish?.({
                    position,
                    element: container.firstElementChild
                })
            } catch (err) {
                console.error('Math rendering error:', err)
                container.textContent = value
                onTypesetFinish?.({
                    position,
                    element: null
                })
            }
        }

        renderMath()
    }, [value, position, onTypesetFinish])

    useEffect(() => {
        if (edit && inputRef.current) {
            inputRef.current.select()
        }
    }, [edit])

    useEffect(() => {
        setInputValue(value)
    }, [value])

    const handleKeyDown = useCallback((evt: React.KeyboardEvent<HTMLInputElement>) => {
        const { key } = evt
        if (key === 'Enter' || key === 'Escape') {
            evt.preventDefault()
            evt.stopPropagation()
            onChange?.({
                position,
                value: inputValue
            })
            onSubmit?.({ position })
        }
    }, [onChange, onSubmit, position, inputValue])

    const handleChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = evt.currentTarget.value
        console.log('handleChange:', {
            position,
            newValue,
            currentValue: value
        })
        setInputValue(newValue)
    }, [value])

    const handleBlur = useCallback(() => {
        onChange?.({
            position,
            value: inputValue
        })
        onSubmit?.({ position })
    }, [onChange, onSubmit, position, inputValue])

    const handleSubmit = useCallback((evt?: React.FormEvent) => {
        evt?.preventDefault()
        console.log('handleSubmit:', {
            position,
            inputValue,
            value
        })
        onChange?.({
            position,
            value: inputValue
        })
        onSubmit?.({ position })
    }, [onChange, onSubmit, position, inputValue, value])

    return (
        <li
            className={`
                grid-cell
                ${selected ? 'selected' : ''}
                ${moving ? 'moving' : ''}
                ${edit ? 'edit' : ''}
            `}
            data-position={position.join(',')}
        >
            <div ref={valueRef} className="value" />

            {edit && (
                <form
                    className="edit"
                    onSubmit={handleSubmit}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onPointerDown={evt => evt.stopPropagation()}
                        onKeyDown={handleKeyDown}
                    />
                </form>
            )}

            <img
                className={`
                    grabber
                    ${mode === 'pan' ? 'visible' : ''}
                `}
                src="./img/grabber.svg"
                onPointerDown={onGrabberPointerDown}
                onDragStart={evt => evt.preventDefault()}
            />

            <img
                className={`
                    loop
                    ${mode === 'arrow' ? 'visible' : ''}
                `}
                src="./img/loop.svg"
                title="Create Loop"
                alt="Create Loop"
                onClick={onAddLoopClick}
            />
        </li>
    )
}

export default GridCell 