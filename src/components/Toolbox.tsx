import React from 'react'

interface ButtonProps {
    checked?: boolean
    disabled?: boolean
    icon: string
    name: string
    className?: string
    onClick?: (evt: React.MouseEvent<HTMLAnchorElement>) => void
}

export const Button = ({
    checked = false,
    disabled = false,
    icon,
    name,
    className,
    onClick
}: ButtonProps) => {
    const handleClick = (evt: React.MouseEvent<HTMLAnchorElement>) => {
        evt.preventDefault()
        onClick?.(evt)
    }

    return (
        <li
            className={`button
                ${checked ? 'checked bg-gray-400' : ''}
                ${disabled ? 'disabled opacity-40 pointer-events-none' : ''}
                ${className || ''}
            `}
            title={name}
        >
            <a
                href="#"
                onClick={handleClick}
            >
                <img
                    style={{ backgroundImage: `url('${icon}')` }}
                    src="./img/tools/blank.svg"
                    alt={name}
                />
            </a>
        </li>
    )
}

export const Separator = () => (
    <li className="separator">
        Separator
    </li>
)

interface ToolboxProps {
    children?: React.ReactNode
    className?: string
    id?: string
}

const Toolbox = ({
    children,
    className,
    id
}: ToolboxProps) => {
    return (
        <section
            className={`
                toolbox
                ${className || ''}
            `}
            id={id}
        >
            <ul>
                {children}
            </ul>
        </section>
    )
}

export default Toolbox 