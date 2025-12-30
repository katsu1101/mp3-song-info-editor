import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "react-native-fs": "./src/shims/empty.ts",
    },
  },
};

export default nextConfig;
