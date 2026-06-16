# Pydantic v2 Reference
# Loaded when target_lang includes py:pydantic-v2

## Migration from v1

Pydantic v2 is a complete rewrite. Key differences from v1:

### Model Definition

```python
# v1
from pydantic import BaseModel
class User(BaseModel):
    name: str
    class Config:
        orm_mode = True
        validate_assignment = True

# v2
from pydantic import BaseModel, ConfigDict
class User(BaseModel):
    model_config = ConfigDict(from_attributes=True, validate_assignment=True)
    name: str
```

### Validators

```python
# v1
from pydantic import validator
@validator('name')
def check_name(cls, v):
    return v.strip()

# v2
from pydantic import field_validator
from typing_extensions import Annotated

@field_validator('name')
@classmethod
def check_name(cls, v: str) -> str:
    return v.strip()
```

### Field Constraints

```python
# v2 uses Annotated types
from pydantic import Field
from typing import Annotated

class Product(BaseModel):
    price: Annotated[float, Field(gt=0, le=9999.99)]
    tags: Annotated[list[str], Field(min_length=1, max_length=10)]
```

### Computed Fields

```python
# v2
from pydantic import computed_field

class User(BaseModel):
    first_name: str
    last_name: str

    @computed_field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
```

### Type Adapters

```python
# v2: validate plain data without a full model
from pydantic import TypeAdapter

UserList = TypeAdapter(list[User])
users = UserList.validate_python(raw_data)
```

### Model Dump

```python
user.model_dump()          # v2 (replaces .dict())
user.model_dump_json()     # v2 (replaces .json())
user.model_dump(mode='json')  # For JSON-compatible types
```

## CodeGen Rules for Pydantic v2

1. Use `model_config = ConfigDict(...)` instead of `class Config`
2. Use `@field_validator` instead of `@validator`
3. Use `Annotated[type, Field(...)]` for constraints
4. Use `model_dump()` / `model_dump_json()` for serialization
5. Use `TypeAdapter` for list/map validation without model classes
6. Import from `pydantic` directly (v2 merged all submodules)
