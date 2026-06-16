# Dart Resources
# Loaded for target_lang: dart

## Null Safety
```dart
String? name;                   // nullable
String nonNull = name ?? 'default';  // null-coalescing
name?.length;                   // null-aware access
late String initialized;        // late initialization

// Null safety with generics
List<String?>? maybeList;
```

## Isolates (Concurrency)
```dart
// Each isolate has its own memory heap
import 'dart:isolate';

void heavyTask(SendPort sendPort) {
    final result = compute();
    sendPort.send(result);
}

final receivePort = ReceivePort();
await Isolate.spawn(heavyTask, receivePort.sendPort);
final result = await receivePort.first;
```

## Mixins
```dart
mixin Logger {
    void log(String msg) => print('[${DateTime.now()}] $msg');
}
mixin Validator {
    bool validate() => true;
}
class Service with Logger, Validator {
    void doWork() {
        log('working');
        assert(validate());
    }
}
```

## Async/Await & Streams
```dart
Future<User> fetchUser(int id) async {
    final response = await http.get(Uri.parse('/users/$id'));
    return User.fromJson(jsonDecode(response.body));
}

Stream<int> countStream(int max) async* {
    for (var i = 1; i <= max; i++) {
        await Future.delayed(Duration(seconds: 1));
        yield i;
    }
}
```

## Key Packages
- flutter — UI framework
- http/dio — HTTP client
- riverpod/bloc — state management
- freezed — immutable classes
- json_serializable — JSON codegen
