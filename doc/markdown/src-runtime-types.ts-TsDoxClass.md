[src](src.md) &rsaquo; [runtime](src-runtime.md) &rsaquo; [types.ts](src-runtime-types.ts.md) &rsaquo; [TsDoxClass](src-runtime-types.ts-TsDoxClass.md)
# interface TsDoxClass
Describes a class

* **extends:** TsDoxEntity<"class">
## Properties
|Name|Return Type|Description|
|---|---|---|
|extends|Array\<string\>|Heritage information|
|implements|Array\<string\>|Heritage information|
|location|TsDoxLocation|Reference to source code|
|decorators|Array\<TsDoxDecorator\>|Annotated decorators|
|properties|TsDoxDict\<TsDoxProperty\>|The class properties|
|methods|TsDoxDict\<TsDoxMethod\>|The class methods|
