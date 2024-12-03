let id = 0

export function getId(): string {
    return (id++).toString()
}

export function clamp(min: number, max: number, x: number): number {
    return Math.max(min, Math.min(max, x))
}

export function lexicalCompare(arr1: number[], arr2: number[]): number {
    if (arr1.length != arr2.length) {
        return arr1.length - arr2.length
    } else if (arr1.length === 0) {
        return 0
    }

    return arr1[0] < arr2[0]
        ? -1
        : arr1[0] > arr2[0]
            ? 1
            : lexicalCompare(arr1.slice(1), arr2.slice(1))
}

export function arrEquals<T>(a: T[], b: T[]): boolean {
    return a.length === b.length && a.every((x, i) => x === b[i])
}

export function arrAdd(a: number[], b: number[]): number[] {
    return a.map((x, i) => x + (b[i] || 0));
}

export function arrScale(m: number, a: number[]): number[] {
    return a.map(x => m * x)
}

export function arrSubtract(a: number[], b: number[]): number[] {
    return a.map((x, i) => x - b[i])
}

// Unicode support
export function b64EncodeUnicode(str: string): string {
    return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
            return String.fromCharCode(parseInt(p1, 16))
        })
    )
}

export function b64DecodeUnicode(str: string): string {
    return decodeURIComponent(
        Array.prototype.map
            .call(atob(str), function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            })
            .join('')
    )
} 