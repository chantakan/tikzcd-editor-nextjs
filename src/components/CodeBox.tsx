import React, { useEffect, useRef } from 'react'
import copyText from 'copy-text-to-clipboard'

interface CodeBoxProps {
    code?: string
    show: boolean
    onCodeInput: (evt: React.ChangeEvent<HTMLTextAreaElement>) => void
    onParseButtonClick: () => void
    onClose: () => void
}

const CodeBox: React.FC<CodeBoxProps> = ({
    code = '',
    show,
    onCodeInput,
    onParseButtonClick,
    onClose
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (show && textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.select()
        }
    }, [show])

    const handleOverlayPointerDown = (evt: React.PointerEvent<HTMLElement>) => {
        if (evt.target !== evt.currentTarget) return
        onClose()
    }

    const handleCopyClick = () => {
        copyText(code)
        textareaRef.current?.focus()
        textareaRef.current?.select()
    }

    return (
        <section
            id="modal-overlay"
            className={show ? 'show' : ''}
            onPointerDown={handleOverlayPointerDown}
        >
            <section className="modal-box code-box">
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={onCodeInput}
                />

                <ul className="buttons">
                    <li>
                        <button onClick={handleCopyClick}>Copy</button>
                    </li>
                    <li className="separator" />
                    <li>
                        <button onClick={onParseButtonClick}>Parse</button>
                    </li>
                    <li>
                        <button onClick={onClose}>Close</button>
                    </li>
                </ul>
            </section>
        </section>
    )
}

export default CodeBox 