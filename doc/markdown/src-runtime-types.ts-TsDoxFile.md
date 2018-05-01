[src](src.md) &rsaquo; [runtime](src-runtime.md) &rsaquo; [types.ts](src-runtime-types.ts.md) &rsaquo; [TsDoxFile](src-runtime-types.ts-TsDoxFile.md)
# interface TsDoxFile
Describes a typescript file

## Properties
|Name|Return Type|Description|
|---|---|---|
|name|string|Path to file|
|modules|TsDoxDict\<TsDoxModule\>|Collection of exported modules|
|classes|TsDoxDict\<TsDoxClass\>|Collection of exported classes|
|interfaces|TsDoxDict\<TsDoxInterface\>|Collection of exported interfaces|
|functions|TsDoxDict\<TsDoxFunction\>|Collection of exported functions|
|enums|TsDoxDict\<TsDoxEnum\>|Collectioin of exported enumerations|
|variables|TsDoxDict\<TsDoxVariable\>|Collection of exported variables and constants|
|types|TsDoxDict\<TsDoxType\>|Collection of exported types|
