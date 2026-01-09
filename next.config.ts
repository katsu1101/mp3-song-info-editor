import type {NextConfig} from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // GitHub Pages向け: 静的ファイル一式を out/ に出す
  output: "export",

  // Project Pagesで /<repo>/ 配信するときに必要になりがち
  basePath,
  assetPrefix: basePath,

  // 静的ホスティングでは next/image の最適化サーバが無いので無効化が無難
  images: {unoptimized: true},

  // 末尾スラッシュを付けて静的配信の相性を上げることが多い
  trailingSlash: true,
};

export default nextConfig;