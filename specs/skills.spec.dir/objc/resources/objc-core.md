# Objective-C Resources
# Loaded for target_lang: objc

## Message Passing (Not Method Calls)
```objc
// Messages go through runtime dispatch
[object doSomething];
[object doSomethingWith:arg1 and:arg2];

// Equivalent to: objc_msgSend(object, @selector(doSomething));
// nil receiver returns nil/0 (no crash)
NSString *name = nil;
NSInteger len = [name length];  // returns 0, no exception
```

## Categories (Extension Methods)
```objc
@interface NSString (MyAdditions)
- (BOOL)isValidEmail;
@end

@implementation NSString (MyAdditions)
- (BOOL)isValidEmail {
    return [self rangeOfString:@"@"].location != NSNotFound;
}
@end

// Now callable on any NSString
[@"test@example.com" isValidEmail];
```

## Blocks (Closures)
```objc
// Block syntax: returnType (^name)(params) = ^returnType(params) { body };
int (^add)(int, int) = ^int(int a, int b) {
    return a + b;
};
int result = add(3, 4);

// Blocks capture variables by value unless __block
__block int counter = 0;
void (^increment)(void) = ^{ counter++; };
```

## Memory Management
```objc
// Manual Retain/Release (pre-ARC)
[obj retain];
[obj release];
[obj autorelease];

// ARC (Automatic Reference Counting) — modern approach
// Strong, weak, unsafe_unretained ownership qualifiers
@property (strong) NSString *name;    // retains
@property (weak) id<Delegate> delegate;  // doesn't retain, nil-ed on dealloc
```

## Key Frameworks
- Foundation — base classes (NSString, NSArray, NSDictionary)
- AppKit (macOS) / UIKit (iOS) — UI frameworks
- Core Data — persistence
- XCTest — testing
