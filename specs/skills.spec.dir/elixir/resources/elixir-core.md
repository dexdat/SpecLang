# Elixir Resources
# Loaded for target_lang: ex / elixir

## Pattern Matching (Pervasive)
```elixir
# Function clauses pattern-match
def factorial(0), do: 1
def factorial(n), do: n * factorial(n - 1)

# Destructuring
%{name: name, age: age} = user
[first | rest] = list
{:ok, result} = operation()
{:error, reason} -> handle_error(reason)
```

## OTP & GenServer
```elixir
defmodule Counter do
  use GenServer

  def start_link(initial), do: GenServer.start_link(__MODULE__, initial)
  def increment(pid), do: GenServer.call(pid, :increment)

  @impl true
  def init(initial), do: {:ok, initial}

  @impl true
  def handle_call(:increment, _from, count) do
    {:reply, count, count + 1}
  end
end
```

## Supervisor Trees
```elixir
children = [
  {Counter, 0},
  {WorkerPool, size: 5}
]
Supervisor.start_link(children, strategy: :one_for_one)
```

## Pipe Operator
```elixir
result =
  data
  |> Enum.filter(&valid?/1)
  |> Enum.map(&transform/1)
  |> Enum.reduce(%{}, &merge/2)
```

## Processes & Message Passing
```elixir
send(pid, {:message, data})
receive do
  {:message, data} -> process(data)
  {:stop, reason} -> :ok
after
  5000 -> {:error, :timeout}
end
```

## Macros & Metaprogramming
```elixir
defmacro unless(condition, do: block) do
  quote do
    if !unquote(condition), do: unquote(block)
  end
end
```

## Common Libraries
- phoenix — web framework
- ecto — database wrapper
- absinthe — GraphQL
- broadway — data pipelines
- oban — job processing
- ex_unit — built-in testing
