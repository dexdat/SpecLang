# speclang-header lines:12
id: "@speclang/ui-index"
parent: "@ref:specs/uipart: 14/14
siblings:
  prev: ""@ref:specs/ui.spec.dir/testingshort: Dashboard index.html entry point
project_level: Alpha
agent_support: agent_assisted
tags: [speclang]
version: 0.1.0
layer: 0
target: src/dashboard/index.html
---

# Dashboard Index.html

Main HTML entry point for the system monitoring dashboard.

## Structure

```speclang
# @block:dashboard/index-html @kind:code
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SpecLang Dashboard</title>
    <link rel="stylesheet" href="/dashboard/styles/tailwind.css">
    <link rel="stylesheet" href="/dashboard/styles/brutalist.css">
</head>
<body class="bg-black text-white">
    <div id="root"></div>
    <script type="module" src="/dashboard/app.tsx"></script>
</body>
</html>
```