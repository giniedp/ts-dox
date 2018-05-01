[src](src.md) &rsaquo; [runtime](src-runtime.md) &rsaquo; [types.ts](src-runtime-types.ts.md) &rsaquo; [TsDoxInterface](src-runtime-types.ts-TsDoxInterface.md)
# interface TsDoxInterface
Describes an interface

* **extends:** TsDoxEntity<"interface">
## Properties
|Name|Return Type|Description|
|---|---|---|
|extends|Array\<string\>|Heritage information|
|implements|Array\<string\>|Heritage information|
|location|TsDoxLocation|Reference to source code|
|properties|TsDoxDict\<TsDoxProperty\>|The declared properties|
|methods|TsDoxDict\<TsDoxMethod\>|The declared methods|
