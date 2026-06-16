# PHP Resources
# Loaded for target_lang: php

## Type System (PHP 8+)
```php
// Union types, named arguments, match expression
function process(int|string $input, bool $flag = true): ?User
{
    return match (true) {
        is_int($input) => findById($input),
        is_string($input) => findByName($input),
    };
}
```

## Attributes (PHP 8+)
```php
#[Route('/users/{id}', methods: ['GET'])]
#[Cache(ttl: 3600)]
function getUser(#[PathParam] int $id): User
{
    // ...
}
```

## Enums (PHP 8.1+)
```php
enum Status: string {
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';

    public function label(): string {
        return match($this) {
            self::Draft => 'Draft',
            self::Published => 'Published',
            self::Archived => 'Archived',
        };
    }
}
```

## Fibers (PHP 8.1+, Cooperative multitasking)
```php
$fiber = new Fiber(function() {
    $value = Fiber::suspend('paused');
    return "resumed with: $value";
});
$suspended = $fiber->start();  // 'paused'
$result = $fiber->resume('hello');  // 'resumed with: hello'
```

## Key Frameworks
- Laravel — full-stack (Eloquent ORM, Blade, Queues)
- Symfony — components-based
- PHPUnit/Pest — testing
- Composer — package manager
- Doctrine — ORM
