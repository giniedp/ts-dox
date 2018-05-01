[src](src.md) &rsaquo; [runtime](src-runtime.md) &rsaquo; [types.ts](src-runtime-types.ts.md) &rsaquo; [TsDoxProperty](src-runtime-types.ts-TsDoxProperty.md)
# interface TsDoxProperty
Describes a class property

* **extends:** TsDoxEntity<"property">
## Properties
|Name|Return Type|Description|
|---|---|---|
|returnType|string|The return type|
|isOptional|boolean|Whether it is declared a soptional|
|isGetter|boolean|Whether it is/has a getter|
|isSetter|boolean|Wheter it is/has a setter|
|decorators|Array\<TsDoxDecorator\>|The annotated decorators|
