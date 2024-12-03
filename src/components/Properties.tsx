import React, { useState, useRef, useEffect } from 'react'
import { Edge } from '../types/base'
import Toolbox, { Button, Separator } from './Toolbox'

interface PropertiesProps {
    edgeId?: number
    show?: boolean
    data?: Edge
    onChange?: (data: { data: Partial<Edge> }) => void
    onRemoveClick?: () => void
}

const Properties: React.FC<PropertiesProps> = ({
    edgeId,
    show = false,
    data = {
        labelPosition: 'left',
        line: 'solid',
        head: 'default',
        tail: 'none',
        value: ''
    } as Edge,
    onChange,
    onRemoveClick
}) => {
    const [edit, setEdit] = useState(false)
    const [editPosition, setEditPosition] = useState({ top: 0, left: 0 })
    const inputRef = useRef<HTMLInputElement>(null)
    const editFormRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        if (!edit && inputRef.current) {
            inputRef.current.blur()
        } else if (edit && inputRef.current) {
            inputRef.current.select()
        }
    }, [edit])

    const updateEditPosition = () => {
        const valueElement = document.querySelector(
            `.grid-arrow[data-id="${edgeId}"] .value`
        )
        if (!valueElement || !editFormRef.current) return

        const { left, top, width } = valueElement.getBoundingClientRect()
        const { width: editWidth, height: editHeight } = window.getComputedStyle(
            editFormRef.current
        )

        setEditPosition({
            left: left + width / 2 - parseFloat(editWidth) / 2,
            top: top - parseFloat(editHeight) - 10
        })
    }

    const handleEditButtonClick = () => {
        updateEditPosition()
        setEdit(true)
    }

    const handleFormSubmit = (evt: React.FormEvent) => {
        evt.preventDefault()
        setEdit(false)
    }

    const handleInputBlur = () => {
        setEdit(false)
    }

    const handleInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.({
            data: { value: evt.currentTarget.value }
        })
    }

    const handleInputKeyDown = (evt: React.KeyboardEvent) => {
        evt.stopPropagation()
    }

    const handleInputKeyUp = (evt: React.KeyboardEvent) => {
        if (evt.key === 'Escape') {
            evt.stopPropagation()
            setEdit(false)
        }
    }

    const handleValueChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.({
            data: { value: evt.currentTarget.value }
        })
    }

    const handleLabelPositionClick = (position: Edge['labelPosition']) => () => {
        onChange?.({
            data: { labelPosition: position }
        })
    }

    const handleLineClick = (line: Edge['line']) => () => {
        onChange?.({
            data: { line }
        })
    }

    const handleHeadClick = (head: Edge['head']) => () => {
        onChange?.({
            data: { head }
        })
    }

    const handleTailClick = (tail: Edge['tail']) => () => {
        onChange?.({
            data: { tail }
        })
    }

    const handleButtonClick = (id: string) => () => {
        let change: Partial<Edge> = {}

        if (['tail', 'mapsto', 'twoheads'].includes(id)) {
            const prop = id === 'twoheads' ? 'head' : 'tail'
            change = { [prop]: data[prop] === id ? 'none' : id }
        } else if (id === 'head') {
            change = { head: data.head == null ? 'none' : null }
        } else if (['double', 'solid', 'dashed', 'dotted'].includes(id)) {
            change = { line: (data.line || 'solid') === id ? 'none' : id }

            if (change.line === 'double') {
                change = {
                    ...change,
                    ...([null, 'none'].includes(data.head ?? '') ? {} : { head: null }),
                    ...([null, 'mapsto', 'none'].includes(data.tail ?? '') ? {} : { tail: 'none' })
                }
            } else if (change.line === 'none') {
                change = {
                    ...change,
                    head: 'none',
                    tail: 'none',
                    labelPosition: 'inside'
                }
            }
        } else if (['labelleft', 'labelright', 'labelinside'].includes(id)) {
            change = {
                labelPosition: data.line === 'none' ? 'inside' : id.slice(5) as Edge['labelPosition']
            }
        } else if (['hook', 'harpoon'].includes(id)) {
            const prop = id === 'hook' ? 'tail' : 'head'
            const ids = [id, `${id}alt`, 'none']
            const index = (ids.indexOf(data[prop] || '') + 1) % ids.length
            change = { [prop]: ids[index] }
        } else if (['bendleft', 'bendright'].includes(id)) {
            if (data.loop != null) return

            let { bend = 0 } = data
            let increase = bend === 0 || (id === 'bendleft' ? bend > 0 : bend < 0)
            let sign = bend !== 0 ? Math.sign(bend) : id === 'bendleft' ? 1 : -1
            let steps = [0, 30, 49, 60, 67, 71, 74, 76, 78, 79, 80]

            let index = steps.reduce(
                (acc, x, i) => (x <= Math.abs(bend) ? i : acc),
                -1
            )
            if (index < steps.length - 1 && bend >= (steps[index + 1] + steps[index]) / 2)
                index++

            let newBend = sign * steps[Math.min(index + (+increase * 2 - 1), steps.length - 1)]
            change = { bend: Math.max(-80, Math.min(80, newBend)) }
        } else if (['shiftleft', 'shiftright'].includes(id)) {
            if (data.loop != null) return

            let { shift = 0 } = data
            change = { shift: shift + (id === 'shiftright' ? 1 : -1) }
        } else if (['reversearrow'].includes(id)) {
            let { from, to, labelPosition, loop } = data

            change = { to: from, from: to }

            if (labelPosition != null) {
                let newLabelPos = labelPosition
                if (labelPosition === 'left') {
                    newLabelPos = 'right'
                } else if (labelPosition === 'right') {
                    newLabelPos = 'left'
                }
                change.labelPosition = newLabelPos
            }

            if (loop != null) {
                let [angle, clockwise] = loop
                change.loop = [angle, !clockwise]
            }

            if (data.bend != null) {
                change.bend = -data.bend
            }

            if (data.shift != null) {
                change.shift = -data.shift
            }
        } else if (['rotate'].includes(id)) {
            if (data.loop == null) return

            let [angle, clockwise] = data.loop
            angle = (angle + 90) % 360
            change.loop = [angle, clockwise]
        }

        onChange?.({ data: change })
    }

    return (
        <section id="properties" className={`${show ? 'show' : ''} ${edit ? 'edit' : ''}`}>
            <Toolbox>
                <Button
                    checked={false}
                    icon="./img/properties/reverse.svg"
                    name="Reverse Arrow (R)"
                    onClick={handleButtonClick('reversearrow')}
                />

                <Separator />

                <Button
                    checked={data.tail === 'tail'}
                    disabled={['none', 'double'].includes(data.line || '')}
                    icon="./img/properties/tail.svg"
                    name="Tail"
                    onClick={handleButtonClick('tail')}
                />

                <Button
                    checked={data.tail === 'mapsto'}
                    disabled={['none'].includes(data.line || '')}
                    icon="./img/properties/mapsto.svg"
                    name="Maps To"
                    onClick={handleButtonClick('mapsto')}
                />

                <Button
                    checked={['hook', 'hookalt'].includes(data.tail || '')}
                    disabled={['none', 'double'].includes(data.line || '')}
                    icon={`./img/properties/${data.tail === 'hookalt' ? 'hookalt' : 'hook'}.svg`}
                    name="Hook"
                    onClick={handleButtonClick('hook')}
                />

                <Separator />

                <Button
                    checked={data.line === 'dotted'}
                    icon="./img/properties/dotted.svg"
                    name="Dotted"
                    onClick={handleButtonClick('dotted')}
                />

                <Button
                    checked={data.line === 'dashed'}
                    icon="./img/properties/dashed.svg"
                    name="Dashed"
                    onClick={handleButtonClick('dashed')}
                />

                <Button
                    checked={!data.line || data.line === 'solid'}
                    icon="./img/properties/solid.svg"
                    name="Solid"
                    onClick={handleButtonClick('solid')}
                />

                <Button
                    checked={data.line === 'double'}
                    icon="./img/properties/double.svg"
                    name="Double"
                    onClick={handleButtonClick('double')}
                />

                <Separator />

                {data.loop == null ? (
                    <>
                        <Button
                            icon="./img/properties/shiftright.svg"
                            name="Shift Right (Down Arrow)"
                            onClick={handleButtonClick('shiftright')}
                        />

                        <Button
                            icon="./img/properties/shiftleft.svg"
                            name="Shift Left (Up Arrow)"
                            onClick={handleButtonClick('shiftleft')}
                        />

                        <Button
                            icon="./img/properties/bendright.svg"
                            name="Bend Right (Shift+Down Arrow)"
                            onClick={handleButtonClick('bendright')}
                        />

                        <Button
                            icon="./img/properties/bendleft.svg"
                            name="Bend Left (Shift+Up Arrow)"
                            onClick={handleButtonClick('bendleft')}
                        />
                    </>
                ) : (
                    <Button
                        icon="./img/properties/rotate.svg"
                        name="Rotate (E)"
                        onClick={handleButtonClick('rotate')}
                    />
                )}

                <Separator />

                <Button
                    checked={['harpoon', 'harpoonalt'].includes(data.head || '')}
                    disabled={['none', 'double'].includes(data.line || '')}
                    icon={`./img/properties/${data.head === 'harpoonalt' ? 'harpoonalt' : 'harpoon'}.svg`}
                    name="Harpoon"
                    onClick={handleButtonClick('harpoon')}
                />

                <Button
                    checked={data.head == null}
                    disabled={['none'].includes(data.line || '')}
                    icon="./img/properties/head.svg"
                    name="Default Head"
                    onClick={handleButtonClick('head')}
                />

                <Button
                    checked={data.head === 'twoheads'}
                    disabled={['none', 'double'].includes(data.line || '')}
                    icon="./img/properties/twoheads.svg"
                    name="Two Heads"
                    onClick={handleButtonClick('twoheads')}
                />

                <Separator />

                <Button
                    checked={!data.labelPosition || data.labelPosition === 'left'}
                    disabled={['none'].includes(data.line || '')}
                    icon="./img/properties/labelleft.svg"
                    name="Left Label (A)"
                    onClick={handleButtonClick('labelleft')}
                />

                <Button
                    checked={data.labelPosition === 'inside'}
                    icon="./img/properties/labelinside.svg"
                    name="Inside Label (S)"
                    onClick={handleButtonClick('labelinside')}
                />

                <Button
                    checked={data.labelPosition === 'right'}
                    disabled={['none'].includes(data.line || '')}
                    icon="./img/properties/labelright.svg"
                    name="Right Label (D)"
                    onClick={handleButtonClick('labelright')}
                />

                <Button
                    checked={false}
                    icon="./img/properties/edit.svg"
                    name="Edit Label (Enter)"
                    onClick={handleEditButtonClick}
                />

                <Separator />

                <Button
                    className="remove"
                    icon="./img/properties/trash.svg"
                    name="Remove Arrow (Del)"
                    onClick={onRemoveClick}
                />
            </Toolbox>

            <form
                ref={editFormRef}
                className="edit"
                style={{
                    left: editPosition.left,
                    top: editPosition.top
                }}
                onSubmit={handleFormSubmit}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={data.value || ''}
                    onBlur={handleInputBlur}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    onKeyUp={handleInputKeyUp}
                />
            </form>
        </section>
    )
}

export default Properties 