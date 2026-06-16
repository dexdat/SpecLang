# Erlang Resources
# Loaded for target_lang: erl / erlang

## Actor Model (Core Paradigm)
```erlang
% Every process is isolated, communicates via messages
loop(State) ->
    receive
        {increment, N} ->
            loop(State + N);
        {get, From} ->
            From ! {value, State},
            loop(State);
        stop ->
            ok
    end.
```

## OTP Behaviours
```erlang
-module(counter).
-behaviour(gen_server).

-export([start_link/0, increment/1]).
-export([init/1, handle_call/3, handle_cast/2]).

start_link() -> gen_server:start_link({local, ?MODULE}, ?MODULE, 0, []).
increment(N) -> gen_server:call(?MODULE, {increment, N}).

init(State) -> {ok, State}.
handle_call({increment, N}, _From, State) ->
    {reply, State + N, State + N}.
```

## Pattern Matching Everywhere
```erlang
% Function clauses
factorial(0) -> 1;
factorial(N) -> N * factorial(N - 1).

% Case expressions
case operation() of
    {ok, Result} -> process(Result);
    {error, Reason} -> handle_error(Reason)
end.
```

## Hot Code Reloading
```erlang
% Deploy new code without stopping the system
code:load_file(my_module).  % Load new version
sys:suspend(my_process).
sys:change_code(my_process, my_module, undefined, []).
sys:resume(my_process).
```

## Supervision Trees
```erlang
% Let it crash philosophy
init([]) ->
    {ok, {{one_for_one, 5, 10}, [
        worker(child1, []),
        supervisor(child_sup, []),
        worker(child2, [], [transient])
    ]}}.
```

## Common Libraries
- cowboy — HTTP server
- ranch — connection pool
- lager — logging
- rebar3 — build tool
- eunit/common_test — testing
