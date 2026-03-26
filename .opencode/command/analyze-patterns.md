---
description: Analyze codebase for recurring patterns, similar implementations, and refactoring opportunities
---

# Command: analyze-patterns

Analyzes the codebase to identify recurring patterns, similar implementations, and refactoring opportunities. This command replaces the previous `codebase-pattern-analyst` subagent with a more flexible, command-based interface.

## Usage

```bash
/analyze-patterns [--pattern=<pattern>] [--language=<lang>] [--depth=<level>] [--output=<format>]
```

### Quick Examples

```bash
# Find all error handling patterns in TypeScript files
/analyze-patterns --pattern=error-handling --language=ts

# Search entire codebase for factory patterns, output as JSON
/analyze-patterns --pattern=factory --depth=deep --output=json

# Find similar API endpoint implementations in JavaScript
/analyze-patterns --pattern=api-endpoint --language=js --output=markdown

# Search for singletons in current directory only
/analyze-patterns --pattern=singleton --depth=shallow
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `--pattern` | string | No | `"*"` | Pattern name (predefined) or regex to search for |
| `--language` | string | No | all | Filter by language: `js`, `ts`, `py`, `go`, `rust`, `java` |
| `--depth` | string | No | `medium` | Search scope: `shallow` (current dir), `medium` (`src/`), `deep` (entire repo) |
| `--output` | string | No | `text` | Output format: `text`, `json`, or `markdown` |

## Predefined Patterns

The command includes built-in pattern detection for common code patterns. Each predefined pattern uses specific regex and heuristics to identify implementations.

### JavaScript/TypeScript Patterns

| Pattern | Detects | Example Matches |
|---------|---------|-----------------|
| `singleton` | Single instance patterns | `class Foo { static instance }`, `let instance = new Foo()` |
| `factory` | Factory method patterns | `function createX()`, `static create()` methods |
| `observer` | Event/observer patterns | `addEventListener`, `subscribe()`, `on('event')` |
| `error-handling` | Try-catch-error patterns | `try {} catch`, `throw new Error`, `.catch()` |
| `async-patterns` | Async/await usage | `async function`, `await`, `Promise.` |
| `api-endpoint` | Route definitions | `app.get()`, `router.post()`, `@Route()` |
| `middleware` | Middleware implementations | `app.use()`, `middleware()`, `next()` |

### Python Patterns

| Pattern | Detects | Example Matches |
|---------|---------|-----------------|
| `decorator` | Decorator usage | `@property`, `@staticmethod`, `@decorator` |
| `context-manager` | Context managers | `with open()`, `__enter__`, `__exit__` |
| `error-handling` | Exception handling | `try/except`, `raise`, `Exception` |
| `async-patterns` | Async code | `async def`, `await`, `asyncio.` |
| `class-patterns` | Class definitions | `class Foo:`, `__init__`, `@dataclass` |

### Go Patterns

| Pattern | Detects | Example Matches |
|---------|---------|-----------------|
| `interface-patterns` | Interface definitions | `interface{}`, `type Foo interface` |
| `error-handling` | Error handling | `if err != nil`, `return err`, `errors.New()` |
| `goroutine-patterns` | Concurrency | `go func()`, `chan`, `<-`, `sync.` |
| `middleware` | Middleware patterns | `func Middleware(next)`, `http.Handler` |

### Custom Patterns

You can provide custom regex patterns for domain-specific analysis:

```bash
# Find all TODO comments
/analyze-patterns --pattern="TODO|FIXME|XXX" --language=ts

# Find all console.log statements
/analyze-patterns --pattern="console\.(log|debug|warn|error)" --language=js

# Find all database queries
/analyze-patterns --pattern="SELECT|INSERT|UPDATE|DELETE" --depth=deep
```

## Behavior

### Pattern Search Process

1. **Parse Parameters**: Extract pattern, language filter, depth, and output format
2. **Validate Pattern**: Check if predefined pattern or validate regex syntax
3. **Execute Search**: Use glob + grep to find matches in specified scope
4. **Analyze Context**: Extract surrounding code for semantic analysis
5. **Calculate Similarity**: Score matches based on structural similarity
6. **Generate Suggestions**: Produce refactoring recommendations
7. **Format Output**: Return results in requested format

### Similarity Scoring

Matches are scored on a 0-100% similarity scale based on:
- **Structural similarity**: Code structure (loops, conditionals, returns)
- **Token overlap**: Common variables, functions, imports
- **Pattern completeness**: How fully the pattern is implemented

### Analysis Output

The command produces:
- Pattern occurrences with file paths and line numbers
- Similarity metrics for each match
- Refactoring suggestions (consolidate, extract, standardize)
- Code quality insights (duplication, inconsistency)

## Output Formats

### Text (Default)

```
Pattern Analysis Report
=======================

Pattern: error-handling
Occurrences: 12
Files: api/src/routes/user.ts, worker/app/services/processor.py

Implementations:
  1. api/src/routes/user.ts:42 - try-catch block (similarity: 95%)
  2. api/src/routes/user.ts:78 - async try-catch (similarity: 92%)
  3. worker/app/services/processor.py:15 - Exception handling (similarity: 88%)
  ...

Refactoring Suggestions:
  - Consolidate error handling in api/src/routes/user.ts
  - Extract to utility function: formatErrorResponse()

Quality Insights:
  - Inconsistent error messages across files
  - Missing error logging in 3 locations
```

### JSON

```json
{
  "pattern": "error-handling",
  "occurrences": 12,
  "files": ["api/src/routes/user.ts", "worker/app/services/processor.py"],
  "implementations": [
    {
      "file": "api/src/routes/user.ts",
      "line": 42,
      "description": "try-catch block",
      "similarity": 0.95,
      "context": "try {\n  await process()\n} catch (error) {"
    }
  ],
  "suggestions": [
    "Consolidate error handling in api/src/routes/user.ts",
    "Extract to utility function: formatErrorResponse()"
  ],
  "qualityInsights": [
    "Inconsistent error messages across files",
    "Missing error logging in 3 locations"
  ]
}
```

### Markdown

```markdown
# Pattern Analysis: error-handling

**Occurrences**: 12  
**Files**: 2  
**Similarity Range**: 85-98%

## Implementations

| File | Line | Description | Similarity |
|------|------|-------------|------------|
| api/src/routes/user.ts | 42 | try-catch block | 95% |
| api/src/routes/user.ts | 78 | async try-catch | 92% |
| worker/app/services/processor.py | 15 | Exception handling | 88% |

## Refactoring Suggestions

- Consolidate error handling in api/src/routes/user.ts
- Extract to utility function: formatErrorResponse()

## Quality Insights

- Inconsistent error messages across files
- Missing error logging in 3 locations
```

## Common Use Cases

### Codebase Cleanup

```bash
# Find all console.log statements to remove
/analyze-patterns --pattern="console\.log" --output=json

# Find all TODO comments
/analyze-patterns --pattern="TODO|FIXME|XXX" --language=ts --output=markdown

# Find all print statements (Python)
/analyze-patterns --pattern="print\(" --language=py
```

### Architecture Analysis

```bash
# Find all API routes
/analyze-patterns --pattern=api-endpoint --depth=deep

# Find all middleware implementations
/analyze-patterns --pattern=middleware --language=ts

# Find all async functions
/analyze-patterns --pattern=async-patterns --language=py
```

### Refactoring Opportunities

```bash
# Find similar error handling to consolidate
/analyze-patterns --pattern=error-handling --output=json

# Find all singletons
/analyze-patterns --pattern=singleton --language=ts

# Find all factories
/analyze-patterns --pattern=factory --language=js
```

## Implementation Details

### Processing Steps

1. **Parameter Parsing**: Extract and validate all command parameters
2. **Pattern Resolution**: Map predefined patterns to regex or use custom regex
3. **File Discovery**: Use glob to find files matching language filter and depth
4. **Search Execution**: Use grep to find pattern matches with context
5. **Semantic Analysis**: Parse surrounding code to understand implementation
6. **Similarity Calculation**: Score matches against pattern template
7. **Suggestion Generation**: Analyze patterns to produce refactoring ideas
8. **Output Formatting**: Format results per requested format

### Context Requirements

The command operates most effectively with access to:
- Codebase structure and file organization
- Language-specific patterns and conventions
- Project-specific naming conventions
- Existing refactoring guidelines (if any)

### Limitations

- **Regex complexity**: Very complex patterns may not match accurately
- **False positives**: Pattern matching is heuristic-based
- **Similarity scoring**: Approximate, not exact semantic similarity
- **Large codebases**: May be slow on repos with 10,000+ files

### Performance

- Typical execution: 2-10 seconds
- Deep search on large repos: up to 30 seconds
- Memory usage: proportional to matches found

## Integration

### Profile Availability

| Profile | Available |
|---------|-----------|
| Essential | ❌ No |
| Developer | ✅ Yes |
| Full | ✅ Yes |
| Advanced | ✅ Yes |
| Business | ❌ No |

### Related Commands

- `/clean` - Remove unused files and dependencies
- `/optimize` - Performance optimization suggestions
- `/test` - Run testing pipeline

## Notes

- Replaces the previous `codebase-pattern-analyst` subagent
- Predefined patterns cover most common code patterns
- Custom regex patterns enable domain-specific analysis
- Results can be exported for documentation or further processing
- Integrates well with refactoring workflows

---

**Command Version**: 1.0.0  
**Status**: Ready for use
