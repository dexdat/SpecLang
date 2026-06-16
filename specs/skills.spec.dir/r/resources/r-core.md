# R Resources
# Loaded for target_lang: r

## Vectorized Operations
```r
# Every operation is vectorized by default
x <- c(1, 2, 3, 4, 5)
x + 1           # c(2, 3, 4, 5, 6)
x[x > 3]        # c(4, 5)
x * x           # element-wise multiplication
```

## Data Frames
```r
df <- data.frame(
    name = c("Alice", "Bob"),
    age = c(30, 25),
    score = c(95.5, 87.0)
)
df[df$age > 28, ]         # filter rows
df$name                   # column access
subset(df, score > 90)    # subset
```

## Formulas
```r
# Statistical modeling uses formula syntax
model <- lm(y ~ x1 + x2, data = df)     # linear model
summary(model)
anova_result <- aov(score ~ group, data = df)
```

## S3/S4/R6 Object Systems
```r
# S3: informal, method dispatch on class attribute
print.myclass <- function(x, ...) cat("MyClass:", x$value)
class(obj) <- "myclass"

# S4: formal, slot-based
setClass("Person", slots = c(name = "character", age = "numeric"))
setMethod("show", "Person", function(object) cat(object@name))

# R6: reference semantics (like OOP)
Person <- R6::R6Class("Person",
    public = list(
        name = NULL, age = NULL,
        initialize = function(name, age) { self$name <- name; self$age <- age },
        greet = function() paste("Hi, I'm", self$name)
    )
)
```

## Key Packages
- dplyr — data manipulation
- ggplot2 — visualization
- tidyr — data tidying
- shiny — web apps
- plumber — REST APIs
- testthat — testing
