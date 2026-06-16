# Haskell Resources
# Loaded for target_lang: hs / haskell

## Monads
```haskell
-- Maybe monad
safeDivide :: Double -> Double -> Maybe Double
safeDivide _ 0 = Nothing
safeDivide x y = Just (x / y)

-- do notation
compute :: Maybe Double
compute = do
  a <- safeDivide 10 2   -- Just 5
  b <- safeDivide a 0     -- Nothing
  return b                -- Nothing (short-circuits)

-- IO, State, Reader, Writer, Either monads
```

## Typeclasses
```haskell
class Eq a where
  (==) :: a -> a -> Bool

instance Eq Color where
  Red == Red = True
  Blue == Blue = True
  _ == _ = False

-- Deriving: data Color = Red | Blue deriving (Eq, Show, Ord)
```

## Algebraic Data Types
```haskell
data Shape = Circle Double | Rectangle Double Double
  deriving (Show)

area :: Shape -> Double
area (Circle r) = pi * r * r
area (Rectangle w h) = w * h
```

## Lazy Evaluation
```haskell
-- Infinite lists work because of laziness
fibs :: [Integer]
fibs = 0 : 1 : zipWith (+) fibs (tail fibs)

take 10 fibs  -- [0,1,1,2,3,5,8,13,21,34]
```

## Common Libraries
- text, bytestring — efficient strings
- aeson — JSON
- warp/wai — web server
- persistent/esqueleto — database
- lens — functional getters/setters
- mtl — monad transformer library
