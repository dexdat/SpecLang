# Perl Resources
# Loaded for target_lang: pl / perl

## Context-Dependent Behavior
```perl
# Scalar context: returns count
my $count = @array;

# List context: returns elements
my @copy = @array;

# Void context: no return value used
@array = sort @array;
```

## Regular Expressions (First-Class)
```perl
my $text = "Contact: alice@example.com or bob@test.org";
my @emails = $text =~ /([\w.+-]+@[\w-]+\.[\w.]+)/g;

# Substitution with capture groups
$text =~ s/(\w+)@(\w+)/$2\@$1/g;

# Regex modifiers: /i (case), /g (global), /m (multiline), /s (dot-all)
```

## References
```perl
my $scalar_ref = \$value;       # scalar reference
my $array_ref  = \@array;       # array reference
my $hash_ref   = \%hash;        # hash reference
my $code_ref   = \&function;    # code reference

# Dereference
my @copy = @$array_ref;
my $val = $hash_ref->{key};
$code_ref->($arg1, $arg2);
```

## CPAN Modules
```perl
use Moose;           # modern OO framework
use DBI;             # database interface
use LWP::UserAgent;  # HTTP client
use JSON;            # JSON parsing
use Test::More;      # testing
use Plack;           # PSGI web server interface
```

## Common Patterns
- `use strict; use warnings;` — always
- `my` for lexical scope, `our` for package scope
- `local` for temporary global override
- `@_` for subroutine arguments
