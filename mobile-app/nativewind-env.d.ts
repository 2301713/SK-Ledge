/// <reference types="nativewind/types" />

// TypeScript can't resolve the side-effect stylesheet imports that NativeWind
// compiles, so declare the module shape for them.
declare module "*.css";
