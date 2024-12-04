import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'export',  // 静的ファイル出力を有効化
    images: {
        unoptimized: true  // 画像の最適化を無効化（静的出力時に必要）
    }
};

export default nextConfig;
