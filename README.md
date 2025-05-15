# 📦 peerdep-checker

> CLI tool to check if your project dependencies support a given peer dependency version.

---

## 🔧 Install

No global install needed — run directly:

```bash
npx peerdep-checker <peer-name> <version> [options]
```

Or install globally:

```bash
npm install -g peerdep-checker
peerdep-checker <peer-name> <version> [options]
```

---

## 🚀 Example

```bash
npx peerdep-checker react 18.2.0 --summary --html report.html
```

---

## ✅ Features

- Checks which dependencies declare a `peerDependency` for a given package (e.g. `react`)
- Evaluates if your target version is compatible
- Shows both **current** and **latest** versions
- Displays dependency type (`dependency` / `devDependency`)
- Terminal table output
- JSON output (`--json`)
- HTML report output (`--html <file>`)
- Summary stats
- Progress indicator

---

## 📄 Output Example (Table)

```
┌────────────────────────────┬──────────────┬────────────┬────────────┬─────────────────────────────┬──────────────┐
│ Package                    │ Type         │ Current    │ Latest     │ react Peer Range            │ Compatible   │
├────────────────────────────┼──────────────┼────────────┼────────────┼─────────────────────────────┼──────────────┤
│ connected-react-router     │ dependency   │ ^6.9.3     │ 6.9.3      │ ^16.4.0 || ^17.0.0           │ ❌ No         │
│ @types/react               │ devDependency│ ^18.0.28   │ 18.0.38    │ *                           │ ✅ Yes        │
└────────────────────────────┴──────────────┴────────────┴────────────┴─────────────────────────────┴──────────────┘
```

---

## 📊 Summary Output

```bash
npx peerdep-checker react 18.2.0 --summary
```

```
📊 Summary:
- Total packages checked: 42
- Compatible: 39
- Incompatible: 3
- Compatibility Rate: 92%
```

---

## 📝 Options

| Flag                  | Description |
|-----------------------|-------------|
| `--summary`           | Show summary stats at the end |
| `--only-incompatible` | Show only incompatible packages |
| `--json`              | Output raw JSON instead of table |
| `--html <file>`       | Save an HTML report to the given file |
| `--hide-progress`     | Disable progress indicator |

---

## 🛠 Requirements

- Node.js v16+
- Uses `npm info` under the hood

---

## 🧪 Coming Soon (Planned)

- Export all `peerDependencies` declared in your package.json's dependencies into a searchable dataset

---
