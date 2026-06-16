# Ruby Resources
# Loaded for target_lang: rb / ruby

## Blocks, Procs, Lambdas
```ruby
# Block (implicit)
[1, 2, 3].map { |n| n * 2 }
[1, 2, 3].each do |n|
  puts n
end

# Proc (explicit closure)
greet = proc { |name| "Hello, #{name}!" }
greet.call("World")

# Lambda (arity-checking)
add = ->(a, b) { a + b }
```

## Metaprogramming
```ruby
# define_method, method_missing
class Dynamic
  define_method(:greet) { |name| "Hi #{name}" }

  def method_missing(name, *args)
    if name.to_s.start_with?('find_by_')
      field = name.to_s.sub('find_by_', '')
      @items.find { |i| i[field.to_sym] == args.first }
    else
      super
    end
  end
end
```

## Modules & Mixins
```ruby
module Loggable
  def log(msg) = puts "[#{Time.now}] #{msg}"
end
module Validatable
  def valid? = errors.empty?
end
class Service
  include Loggable
  include Validatable
end
```

## Enumerable
```ruby
data.select { |x| x.positive? }
    .map { |x| x * 2 }
    .reduce(0) { |sum, x| sum + x }

# Lazy evaluation
(1..Float::INFINITY).lazy.select(&:even?).first(5)
```

## Key Gems
- Rails — web framework
- RSpec/Minitest — testing
- Sidekiq — background jobs
- dry-rb — type validation
- Sequel/ActiveRecord — ORM
