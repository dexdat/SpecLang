---
name: sip-075-spec-entities-speclang-v0
title: "SIP 75: Spec Entity Types"
version: 0.1.0
description: Entity definitions, operations, and relationships in specs
category: standard
---

# SIP 75: Spec Entity Types

**Status:** Draft  
**Version:** 0.1.0  
**Author:** SpecLang Core Team

## README

This SIP defines Spec Entity Types—the `@kind:entity` blocks that define data structures, domain objects, and their relationships.

### Quick Start

Entity types:
1. **Data entities**: User, Order, Product
2. **Value objects**: Email, Money, Address
3. **Aggregates**: Order with Items
4. **Enums**: Status, Role, Type

### When to Read This

- **Defining entities:** How to structure entity blocks
- **Code generation:** Entity-to-code mapping
- **Relationships:** How entities connect

### Related SIPs

- SIP 3: Block System
- SIP 12: Code Generation
- SIP 71: Standard Library Types

## Abstract

This SIP defines how to write entity specifications in SpecLang. Entities are the core data structures in specs, representing domain objects with fields, relationships, and operations. They are the primary target for code generation.

## Motivation

Standardized entity definitions are needed because:
- Code generators need consistent structure
- Relationships need clear semantics
- Validation rules need field definitions
- Documentation needs entity schemas

## Rationale

**Entity-First Design:**

1. **Clear structure**: Fields, types, constraints
2. **Relationships**: Explicit references between entities
3. **Operations**: Methods on entity types
4. **Validation**: Built-in constraint support

This follows patterns from DDD, JPA, and Prisma.

## Specification

### Entity Block Syntax

```yaml
EntityBlock:
  syntax: |
    ### @block:<id> @kind:entity
    <EntityName>:
      description?: String
      fields:
        <fieldName>: <Type> [constraints]
      operations?:
        <opName>: <signature>
      relationships?:
        <relName>: <Relationship>
      indexes?:
        - <indexDef>
```

### Field Types

```yaml
FieldTypes:
  primitives:
    - String
    - Int
    - Float
    - Bool
    - DateTime
    - UUID
    
  collections:
    - List<T>
    - Map<K, V>
    - Set<T>
    
  optional:
    - T?          # nullable
    - Option<T>   # explicit option
    
  references:
    - @ref:<EntityName>     # reference to entity
    - ID<EntityName>        # typed ID
    
  custom:
    - <defined elsewhere>   # user-defined type
```

### Field Constraints

```yaml
FieldConstraints:
  String:
    - min: Int           # minimum length
    - max: Int           # maximum length
    - pattern: String    # regex pattern
    - format: String     # built-in format (email, url, etc.)
    
  Int:
    - min: Int           # minimum value
    - max: Int           # maximum value
    - positive: Bool     # must be > 0
    
  Float:
    - min: Float
    - max: Float
    - precision: Int     # decimal places
    
  Collection:
    - minItems: Int      # minimum items
    - maxItems: Int      # maximum items
    - unique: Bool       # all items unique
    
  General:
    - required: Bool     # field is required
    - default: Any       # default value
    - deprecated: String # deprecation message
```

### Relationship Types

```yaml
RelationshipTypes:
  one_to_one:
    syntax: "<Entity> @one"
    description: "Single related entity"
    example: "profile: @ref:Profile @one"
    
  one_to_many:
    syntax: "<Entity> @many"
    description: "Multiple related entities"
    example: "orders: @ref:Order @many"
    
  many_to_many:
    syntax: "<Entity> @manyToMany"
    description: "Bidirectional many relationship"
    example: "tags: @ref:Tag @manyToMany"
    
  belongs_to:
    syntax: "<Entity> @belongsTo"
    description: "This entity belongs to another"
    example: "user: @ref:User @belongsTo"
    
  has_many:
    syntax: "<Entity> @hasMany"
    description: "This entity has many of another"
    example: "items: @ref:OrderItem @hasMany"
```

### Entity Operations

```yaml
EntityOperations:
  instance_methods:
    description: "Methods called on entity instance"
    syntax: "<methodName>(<params>) -> <return>"
    examples:
      - "fullName(): String"
      - "isValid(): Bool"
      - "calculateTotal(): Money"
      
  static_methods:
    description: "Methods called on entity type"
    syntax: "static <methodName>(<params>) -> <return>"
    examples:
      - "static findById(id: ID<User>): Option<User>"
      - "static create(data: UserData): Result<User, Error>"
      
  lifecycle_hooks:
    description: "Hooks for entity lifecycle events"
    hooks:
      - beforeCreate
      - afterCreate
      - beforeUpdate
      - afterUpdate
      - beforeDelete
      - afterDelete
```

### Entity Metadata

```yaml
EntityMetadata:
  annotations:
    @table: String           # database table name
    @collection: String      # collection name (NoSQL)
    @aggregate: Bool         # is an aggregate root
    @valueObject: Bool       # is a value object
    @auditable: Bool         # track changes
    @versioned: Bool         # enable versioning
    
  indexes:
    - fields: [String]
      unique: Bool
      name: String?
      
  constraints:
    - name: String
      fields: [String]
      type: "unique" | "check" | "exclude"
```

## Examples

### Example 1: Basic Entity

```yaml
### @block:entities/user @kind:entity
User:
  description: "Application user account"
  fields:
    id: ID<User> @required
    email: String @format:email @unique
    name: String @min:1 @max:100
    role: Role @default:"member"
    active: Bool @default:true
    createdAt: DateTime @required
    updatedAt: DateTime?
  operations:
    fullName(): String
    isActive(): Bool
    hasRole(role: Role): Bool
  indexes:
    - fields: [email]
      unique: true
```

### Example 2: Entity with Relationships

```yaml
### @block:entities/order @kind:entity
Order:
  description: "Customer order"
  fields:
    id: ID<Order> @required
    customerId: ID<Customer> @required
    status: OrderStatus @default:"pending"
    total: Money @required
    notes: String?
    createdAt: DateTime @required
    
  relationships:
    customer: @ref:Customer @belongsTo
    items: @ref:OrderItem @hasMany
    payments: @ref:Payment @hasMany
    
  operations:
    calculateTotal(): Money
    addItem(item: OrderItem): Order
    removeItem(itemId: ID<OrderItem>): Order
    submit(): Result<Order, Error>
    cancel(): Result<Order, Error>
    
  constraints:
    - name: positive_total
      type: check
      fields: [total]
      condition: "total.amount >= 0"
```

### Example 3: Value Object

```yaml
### @block:entities/money @kind:entity @valueObject
Money:
  description: "Monetary amount with currency"
  fields:
    amount: Decimal @required @precision:2
    currency: Currency @required
  operations:
    add(other: Money): Money
    subtract(other: Money): Money
    multiply(factor: Float): Money
    format(): String
    equals(other: Money): Bool
  invariants:
    - "same currency required for add/subtract"
    - "amount has at most 2 decimal places"
```

### Example 4: Enum Entity

```yaml
### @block:entities/order-status @kind:entity
OrderStatus:
  description: "Possible order states"
  type: enum
  values:
    - pending: "Order created, awaiting payment"
    - paid: "Payment received"
    - processing: "Order being prepared"
    - shipped: "Order in transit"
    - delivered: "Order received by customer"
    - cancelled: "Order cancelled"
    - refunded: "Order refunded"
  transitions:
    - from: pending
      to: [paid, cancelled]
    - from: paid
      to: [processing, cancelled, refunded]
    - from: processing
      to: [shipped, cancelled]
    - from: shipped
      to: [delivered, refunded]
```

### Example 5: Aggregate Root

```yaml
### @block:entities/customer @kind:entity @aggregate
Customer:
  description: "Customer aggregate root"
  fields:
    id: ID<Customer> @required
    email: String @format:email @unique
    name: String @required
    status: CustomerStatus @default:"active"
    addresses: List<Address>
    preferences: CustomerPreferences
    createdAt: DateTime @required
    
  relationships:
    orders: @ref:Order @hasMany
    reviews: @ref:Review @hasMany
    
  operations:
    addAddress(address: Address): Customer
    removeAddress(addressId: ID<Address>): Customer
    setDefaultAddress(addressId: ID<Address>): Customer
    placeOrder(items: List<OrderItem>): Result<Order, Error>
    
  invariants:
    - "at least one address required to place order"
    - "email must be verified for active status"
```

## Code Generation Mappings

```yaml
LanguageMappings:
  TypeScript:
    entity: interface or class
    fields: properties with types
    operations: methods
    relationships: optional references
    
  Go:
    entity: struct
    fields: struct fields with tags
    operations: methods on struct
    relationships: pointers or slices
    
  Python:
    entity: dataclass or Pydantic model
    fields: typed attributes
    operations: methods
    relationships: optional references
    
  Rust:
    entity: struct
    fields: struct fields
    operations: impl block
    relationships: Option<Box<T>> or Vec<T>
```

## Implementation

```python
from dataclasses import dataclass
from typing import List, Dict, Optional, Any

@dataclass
class Field:
    name: str
    type: str
    constraints: Dict[str, Any]
    required: bool = True
    default: Any = None

@dataclass
class Relationship:
    name: str
    target: str
    kind: str  # one, many, belongsTo, hasMany, manyToMany

@dataclass
class Operation:
    name: str
    params: List[tuple]  # [(name, type), ...]
    return_type: str
    is_static: bool = False

@dataclass
class Entity:
    id: str
    name: str
    description: Optional[str]
    fields: List[Field]
    operations: List[Operation]
    relationships: List[Relationship]
    indexes: List[Dict]
    constraints: List[Dict]
    annotations: Dict[str, Any]
    
    @classmethod
    def from_block(cls, block_content: str) -> 'Entity':
        parser = EntityParser()
        return parser.parse(block_content)
    
    def validate(self) -> List[str]:
        errors = []
        for field in self.fields:
            errors.extend(self._validate_field(field))
        for rel in self.relationships:
            errors.extend(self._validate_relationship(rel))
        return errors
```

## References

- @ref:speclang/spec-format
- @ref:speclang/spec-format.spec.dir/blocks
- SIP 3: Block System
- SIP 12: Code Generation

## Copyright

This document is in the public domain.
