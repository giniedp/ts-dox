[src](src.md) &rsaquo; [runtime](src-runtime.md) &rsaquo; [types.ts](src-runtime-types.ts.md) &rsaquo; [TsDoxCallableEntity](src-runtime-types.ts-TsDoxCallableEntity.md)
# interface TsDoxCallableEntity
Describes common function properties

* **extends:** TsDoxEntity<T>
## Properties
|Name|Return Type|Description|
|---|---|---|
|signature|string|The extracted signature|
|location|TsDoxLocation|Reference to the source code where it is declared|
|returnType|string|The return type|
|parameters|Array\<TsDoxParameter\>|The method parameters|
|decorators|Array\<TsDoxDecorator\>|The decorator annotations|
