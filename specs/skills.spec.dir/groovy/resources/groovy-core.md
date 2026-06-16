# Groovy Resources
# Loaded for target_lang: groovy

## Closures
```groovy
def list = [1, 2, 3, 4, 5]
def doubled = list.collect { it * 2 }
def evens = list.findAll { it % 2 == 0 }
list.each { println it }

// Closure delegation for DSLs
def config = {
    server {
        port 8080
        host 'localhost'
    }
}
```

## Metaprogramming
```groovy
// Runtime metaprogramming
String.metaClass.shout = { -> delegate.toUpperCase() + '!!!' }
"hello".shout()  // "HELLO!!!"

// Compile-time with AST transformations
@groovy.transform.Canonical  // generates equals, hashCode, toString
class User {
    String name
    int age
}
```

## Builders (DSL)
```groovy
// MarkupBuilder: HTML/XML
def html = new groovy.xml.MarkupBuilder()
html.body {
    h1 'Title'
    p 'Content'
}

// JsonBuilder: JSON
def json = new groovy.json.JsonBuilder()
json.people {
    person(name: 'Alice', age: 30)
    person(name: 'Bob', age: 25)
}
```

## Gradle (Build System)
```groovy
// Gradle build scripts are Groovy DSLs
dependencies {
    implementation 'org.springframework:spring-core:6.1.0'
    testImplementation 'junit:junit:4.13.2'
}
```

## Key Frameworks
- Grails — web framework
- Spock — testing (BDD)
- Gradle — build tool
- Jenkins pipelines — CI/CD
