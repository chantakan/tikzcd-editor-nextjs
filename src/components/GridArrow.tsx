import React, { useEffect, useRef, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { arrSubtract, arrScale, arrAdd } from '../lib/helper'
import {
    norm,
    normalize,
    rotate90DegreesAntiClockwise,
    getRectCenteredAround,
    getRectSegmentIntersections
} from '../lib/geometry'
import { BaseEdge } from '../types/base'

const tailHeadWidth = 9.764
const tailHeadHeight = 13

interface GridArrowProps extends BaseEdge {
    cellSize: number
    id?: string
    from: [number, number]
    to: [number, number]
    fromSize?: [number, number]
    toSize?: [number, number]
    selected?: boolean
    phantom?: boolean
    onClick?: (evt: React.MouseEvent<HTMLLIElement>) => void
}

const GridArrow = React.memo<GridArrowProps>(({
    cellSize,
    id,
    from,
    to,
    fromSize = [0, 0],
    toSize = [0, 0],
    selected = false,
    phantom = false,
    bend = 0,
    shift = 0,
    loop,
    tail = 'none',
    line = 'solid',
    head = 'default',
    value = '',
    labelPosition = 'left',
    onClick
}) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const pathRef = useRef<SVGGElement>(null)
    const valueRef = useRef<HTMLDivElement>(null)
    const [state, setState] = useState(() => ({
        labelX: '50%',
        labelY: 0,
        startPoint: from.map(x => x * cellSize + cellSize / 2),
        endPoint: to.map(x => x * cellSize + cellSize / 2)
    }))

    useEffect(() => {
        const container = valueRef.current
        if (!container) return

        const renderMath = () => {
            try {
                container.innerHTML = ''

                if (!value?.trim()) {
                    const span = document.createElement('span')
                    span.className = 'opacity-0'
                    span.textContent = '_'
                    container.appendChild(span)
                    return
                }

                const mathValue = value.replace(/^\\\((.*)\\\)$/, '$1')
                katex.render(mathValue, container, {
                    throwOnError: false,
                    displayMode: false,
                    strict: false,
                    trust: true,
                    macros: {
                        '\\to': '\\rightarrow',
                        '\\implies': '\\Rightarrow'
                    }
                })
            } catch (err) {
                console.error('Math rendering error:', err)
                if (container) {
                    container.textContent = value || ''
                }
            }
        }

        renderMath()
    }, [value])

    const calculatePoints = () => {
        let [fromWidth, fromHeight] = fromSize || [0, 0]
        let [toWidth, toHeight] = toSize || [0, 0]

            ;[toWidth, toHeight] = [toWidth, toHeight].map(x =>
                Math.min(cellSize, x + 20)
            )
            ;[fromWidth, fromHeight] = [fromWidth, fromHeight].map(x =>
                Math.min(cellSize, x + 20)
            )

        let [fromCenter, toCenter] = [from, to].map(x =>
            x.map(y => y * cellSize + cellSize / 2)
        ) as [number, number][]

        let m = arrScale(0.5, arrAdd(fromCenter, toCenter)) as [number, number]
        let d = arrSubtract(toCenter, fromCenter) as [number, number]
        let length = norm(d as [number, number])

        let controlPoint = arrAdd(
            m,
            arrScale(
                (length * Math.tan((-(bend || 0) * Math.PI) / 180)) / 2,
                normalize(rotate90DegreesAntiClockwise(d as [number, number])) as [number, number]
            )
        ) as [number, number]

        let fromRect = getRectCenteredAround(fromCenter as [number, number], fromWidth, fromHeight)
        let toRect = getRectCenteredAround(toCenter as [number, number], toWidth, toHeight)

        return {
            fromIntersection: getRectSegmentIntersections(
                fromRect,
                fromCenter as [number, number],
                controlPoint
            )[0] || fromCenter,
            toIntersection: getRectSegmentIntersections(
                toRect,
                controlPoint,
                toCenter as [number, number]
            )[0] || toCenter
        }
    }

    useEffect(() => {
        const points = calculatePoints()
        setState(prev => ({
            ...prev,
            startPoint: points.fromIntersection,
            endPoint: points.toIntersection
        }))
    }, [from.join(','), to.join(','), fromSize.join(','), toSize.join(','), cellSize, bend])

    let width: number,
        height: number,
        leftOffset: number,
        topOffset: number,
        path: string,
        degree: number,
        mx: number,
        my: number,
        tailProps: { x: number; y: number; transform: string },
        headProps: { x: number; y: number; transform: string }

    if (loop) {
        // ループの描画
        if (phantom) return null
            ;[mx, my] = state.endPoint

        let [angle, clockwise] = loop || [0, false]
        let flip = clockwise ? -1 : 1
        let [radius, labelRadius] = [24, 14]

        width = height = radius * 4 + tailHeadHeight
        degree = 360 - angle
        path = `
            M ${width / 2 - labelRadius} ${height / 2}
            a ${radius} ${radius * 0.8} 0 1 0 ${labelRadius * 2} 0
        `

        let offset = 16
        leftOffset = -width / 2 - offset * Math.sin((degree * Math.PI) / 180)
        topOffset = offset * Math.cos((degree * Math.PI) / 180)

        let multiplier = (flip * 180) / Math.PI
        let baseDegree = Math.PI * (clockwise ? 1 : 0) * multiplier
        let rotate = (Math.asin(labelRadius / radius) - Math.PI) * multiplier
        let offsetLabel = labelRadius * flip
        let tailRotateAnchor = [width / 2 - offsetLabel, height / 2]
        let headRotateAnchor = [width / 2 + offsetLabel, height / 2]

        tailProps = {
            x: width / 2 - offsetLabel,
            y: height / 2,
            transform: `
                rotate(${baseDegree - rotate} ${tailRotateAnchor.join(' ')})
                translate(${-tailHeadWidth} ${-tailHeadHeight / 2})
            `
        }

        headProps = {
            x: width / 2 + offsetLabel,
            y: height / 2,
            transform: `
                rotate(${baseDegree + rotate} ${headRotateAnchor.join(' ')})
                translate(0 ${-tailHeadHeight / 2})
            `
        }
    } else {
        // 通常の矢印の描画
        let [fromCenter, toCenter] = [state.startPoint, state.endPoint]
            ;[mx, my] = arrScale(0.5, arrAdd(fromCenter, toCenter))

        let d = arrSubtract(toCenter, fromCenter)
        let { length } = { length: norm(d) }
        degree = (Math.atan2(d[1], d[0]) * 180) / Math.PI

        length -= 2 * tailHeadWidth
        let bendAngle = (bend * Math.PI) / 180

        let [cx, cy] = [length / 2, -(length * Math.tan(bendAngle)) / 2]
            ;[width, height] = [
                length + 2 * tailHeadWidth + tailHeadHeight,
                Math.max(Math.abs(cy) + tailHeadHeight, tailHeadHeight)
            ]
            ;[leftOffset, topOffset] = [-width / 2, 0]

        let leftPoint = [tailHeadWidth, height / 2]
        let rightPoint = [tailHeadWidth + length, height / 2]
        let controlPoint = arrAdd(leftPoint, [cx, cy])

        path = `
            M ${leftPoint.join(' ')}
            Q ${controlPoint.join(' ')}
            ${rightPoint.join(' ')}
        `

        tailProps = {
            x: 0,
            y: height / 2 - tailHeadHeight / 2,
            transform: `rotate(${-bend} ${tailHeadWidth} ${height / 2})`
        }

        headProps = {
            x: length + tailHeadWidth,
            y: height / 2 - tailHeadHeight / 2,
            transform: `rotate(${bend} ${length + tailHeadWidth} ${height / 2})`
        }
    }

    useEffect(() => {
        if (!valueRef.current) return

        const bbox = pathRef.current?.getBBox()
        if (!bbox) return

        const { width, height } = window.getComputedStyle(valueRef.current)
        const [labelWidth, labelHeight] = [width, height].map(parseFloat)

        const direction = arrSubtract(state.endPoint, state.startPoint)
        const loopAngle = loop ? loop[0] : 0

        const angle = Math.atan2(direction[1], direction[0]) + (loopAngle * Math.PI) / 180
        const newHeight = labelHeight * Math.abs(Math.cos(angle)) + labelWidth * Math.abs(Math.sin(angle))
        const heightDiff = newHeight - labelHeight
        const labelOffsetX = -labelWidth / 2 - (!loop ? tailHeadHeight / 2 : 0)

        setState(prev => ({
            ...prev,
            labelX: `calc(50% + ${labelOffsetX}px)`,
            labelY: {
                left: bend >= 0
                    ? bbox.y - labelHeight - heightDiff / 2 - 5
                    : bbox.y + bbox.height - labelHeight - heightDiff / 2 - 11,
                right: bend >= 0
                    ? bbox.y + heightDiff / 2 + 11
                    : bbox.y + bbox.height + heightDiff / 2 + 5,
                inside: bend >= 0
                    ? bbox.y - labelHeight / 2
                    : bbox.y + bbox.height - labelHeight / 2
            }[labelPosition]
        }))
    }, [bend, labelPosition, loop, state.startPoint, state.endPoint])

    return (
        <li
            data-id={id}
            className={`
                grid-arrow
                ${selected ? 'selected' : ''}
                ${phantom ? 'phantom' : ''}
            `}
            style={{
                height,
                width,
                left: mx + leftOffset,
                top: my - height / 2 + topOffset,
                transform: `rotate(${degree}deg) translateY(${shift * 7}px)`
            }}
            onClick={onClick}
        >
            <svg ref={svgRef} width={width} height={height}>
                <path
                    className="mouse"
                    fill="none"
                    strokeWidth="12"
                    stroke="transparent"
                    strokeLinecap="square"
                    d={path}
                />

                <g
                    ref={pathRef}
                    fill="none"
                    mask={line === 'double' ? `url(#hollowPath${id})` : undefined}
                >
                    <path
                        d={path}
                        stroke={line === 'none' ? 'transparent' : 'black'}
                        strokeWidth={line === 'double' ? 6 : 1}
                        strokeDasharray={
                            {
                                dashed: '7, 3',
                                dotted: '2, 4'
                            }[line]
                        }
                    />

                    {line === 'double' && (
                        <mask
                            id={`hollowPath${id}`}
                            maskUnits="userSpaceOnUse"
                        >
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            <path
                                d={path}
                                stroke="black"
                                strokeWidth="4"
                                strokeLinecap="square"
                            />
                        </mask>
                    )}
                </g>

                <image
                    x={tailProps.x}
                    y={tailProps.y}
                    width={tailHeadWidth}
                    height={tailHeadHeight}
                    transform={tailProps.transform}
                    href={`./img/arrow/${line === 'double' ? 'double-' : ''}${tail || 'none'}.svg`}
                />

                <image
                    x={headProps.x}
                    y={headProps.y}
                    width={tailHeadWidth}
                    height={tailHeadHeight}
                    transform={headProps.transform}
                    href={`./img/arrow/${line === 'double' ? 'double-' : ''}${head || 'default'}.svg`}
                />
            </svg>

            <div
                ref={valueRef}
                className={`value ${labelPosition || 'left'}`}
                style={{
                    left: state.labelX,
                    top: state.labelY,
                    transform: `rotate(${-degree}deg)`
                }}
            />
        </li>
    )
}, (prevProps, nextProps) => {
    for (let key in nextProps) {
        if (nextProps[key as keyof GridArrowProps] !== prevProps[key as keyof GridArrowProps]) {
            return false
        }
    }
    return true
})

export default GridArrow 