// 型定義
type Point = [number, number]
type Rect = {
    width: number
    height: number
    left: number
    top: number
}

// 中心点を基準に矩形を取得
export function getRectCenteredAround(
    [x, y]: Point,
    width: number,
    height: number
): Rect {
    return {
        width,
        height,
        left: x - width / 2,
        top: y - height / 2
    }
}

// 点が矩形の内部にあるかチェック
export function insideRect(
    rect: Rect,
    p: Point
): boolean {
    let { left, top, width, height } = rect
    let [p1, p2] = p

    return left <= p1 && p1 <= left + width && top <= p2 && p2 <= top + height
}

// 矩形と線分の交点を取得
export function getRectSegmentIntersections(
    rect: Rect,
    p1: Point,
    p2: Point
): Point[] {
    let { left, top, width, height } = rect
    let [x1, y1] = p1
    let [x2, y2] = p2

    let d = [x2 - x1, y2 - y1]
    let leftTop = [left, top]

    let ts = [x1, y1]
        .map((x, i) =>
            [leftTop[i], leftTop[i] + [width, height][i]].map(y => (y - x) / d[i])
        )
        .reduce((acc, x) => [...acc, ...x], [])

    return ts
        .filter(t => 0 <= t && t <= 1)
        .map(t => p1.map((x, i) => x + t * d[i]) as Point)
        .filter(p => insideRect(rect, p))
}

// 90度反時計回りに回転
export function rotate90DegreesAntiClockwise([x, y]: Point): Point {
    return [-y, x]
}

// ベクトルのノルム（長さ）を計算
export function norm(p: number[]): number {
    return Math.sqrt(p.reduce((acc, x) => acc + x * x, 0))
}

// ベクトルを正規化
export function normalize(p: number[]): number[] {
    let n = norm(p)
    return p.map(x => x / n)
} 