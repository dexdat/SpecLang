# Scala Resources
# Loaded for target_lang: scala

## Implicits → Given/Using (Scala 3)
```scala
// Scala 3: given/using replaces implicits
given ordering: Ordering[User] with
  def compare(a: User, b: User) = a.name.compareTo(b.name)

def sortUsers(users: List[User])(using ord: Ordering[User]) = users.sorted
```

## Pattern Matching
```scala
def describe(x: Any): String = x match
  case i: Int if i > 0 => s"positive int: $i"
  case s: String       => s"string of length ${s.length}"
  case List(a, b, _*)  => s"list starting with $a, $b"
  case Right(value)    => s"success: $value"
```

## Case Classes & Sealed Traits
```scala
sealed trait Result[+T]
case class Success[T](value: T) extends Result[T]
case class Failure(error: String) extends Result[Nothing]
```

## Higher-Kinded Types
```scala
trait Functor[F[_]]:
  def map[A, B](fa: F[A])(f: A => B): F[B]

given Functor[List] with
  def map[A, B](fa: List[A])(f: A => B) = fa.map(f)
```

## For-Comprehensions
```scala
val result = for
  user <- findUser(id)
  order <- findOrder(user.id)
  if order.total > 100
yield (user.name, order.total)
```

## Futures & Concurrency
```scala
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

val f = Future { heavyComputation() }
f.map(_ * 2).foreach(println)
```

## Key Libraries
- cats / cats-effect — functional programming
- zio — effect system
- akka / pekko — actor system
- http4s / tapir — HTTP
- slick / doobie — database
- circe — JSON
