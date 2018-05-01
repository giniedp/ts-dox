[src](src.md) &rsaquo; [extractor](src-extractor.md) &rsaquo; [index.ts](src-extractor-index.ts.md) &rsaquo; [transform](src-extractor-index.ts-transform.md)
# function transform
Creates a Transform object for eaxmple to be used in a gulp pipeline

```ts
export function transform(options: {
  concat?: string,
  map?: (input: any) => any,
  spacer?: number | string
} = {}) 
```