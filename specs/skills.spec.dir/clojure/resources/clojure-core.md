# Clojure Resources
# Loaded for target_lang: clj / clojure

## Immutable Persistent Data Structures
```clojure
;; Lists, vectors, maps, sets — all persistent (structural sharing)
(def v [1 2 3])
(conj v 4)  ;; => [1 2 3 4], v unchanged

(def m {:name "Alice" :age 30})
(assoc m :age 31)  ;; new map, m unchanged
```

## Sequence Abstraction
```clojure
;; Most functions work on any seqable
(map inc [1 2 3])        ;; => (2 3 4)
(filter even? '(1 2 3 4)) ;; => (2 4)
(reduce + 0 (range 100))  ;; => 4950
```

## Transducers (Composable Transformations)
```clojure
;; Transducers separate transformation from collection type
(def xf (comp (filter even?) (map inc)))
(into [] xf (range 10))  ;; => [1 3 5 7 9 11]
(sequence xf (range 10)) ;; => (1 3 5 7 9 11)
```

## Macros
```clojure
(defmacro unless [test & body]
  `(if (not ~test) (do ~@body)))
```

## Atoms, Refs, Agents (STM)
```clojure
(def counter (atom 0))
(swap! counter inc)           ;; atomic update
(dosync (alter balance + 100)) ;; transactional
```

## Multimethods & Protocols
```clojure
(defmulti area :shape)
(defmethod area :circle [{:keys [r]}] (* Math/PI r r))
(defmethod area :rectangle [{:keys [w h]}] (* w h))
```

## Core Libraries
- ring/compojure — web
- next.jdbc — database
- core.async — CSP channels
- spec — validation/generative testing
- integrant/mount — state management
