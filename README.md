# Git State & Revision Differ

[![VS Code](https://img.shields.io/badge/VS%20Code-v1.90.0+-blue.svg)](https://code.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Git State & Revision Differ** is a lightweight, high-performance Visual Studio Code extension that helps developers instantly differentiate between code that is **Pushed**, **Committed (Unpushed)**, and **Modified (Uncommitted)** directly within the editor. 

It also gives you deep, seamless diffing capabilities: compare any **specific line** or your **entire file** with any Git commit (defaulting to the latest commit `HEAD`).

---

## 🌟 Key Features

### 1. 3-Tier Visual Code State Differentiation
Never wonder whether your changes are pushed to remote, committed locally, or still uncommitted:

| State | Gutter Indicator | Overview Ruler | Description |
| :--- | :--- | :--- | :--- |
| **🟣 Committed (Unpushed)** | Purple Stripe | Purple Mark | Committed locally to `HEAD`, but not yet pushed to the remote branch (`origin/main`). |
| **🟡 Modified (Uncommitted)** | Amber Stripe | Amber Mark | Uncommitted changes in your working tree or staging area. |
| **🟢 Pushed** | Clean (or Green Dot) | Optional | Already pushed and synced with your remote upstream branch. |

> **Clean by default**: To keep your editor uncluttered, mature code (already pushed) remains clean by default. You can easily enable green pushed indicators in Settings if desired (`gitStateDiffer.decorations.showPushed: true`).

---

### 2. Rich Line Hover Card
Hover your mouse over **any line** of code to instantly inspect:
- **Git State Badge**: `🟢 Pushed`, `🟣 Committed (Unpushed)`, or `🟡 Modified (Uncommitted)`.
- **Commit Details**: Commit short hash, author name, timestamp, and commit message.
- **Upstream Info**: Remote branch tracking information (e.g. `origin/main`).
- **Interactive Quick Links**:
  - `[Compare File with Commit]`
  - `[Compare This Line]`

---

### 3. Real-Time Status Bar
The bottom-right status bar displays the active status of whatever line your cursor is currently on:
- `$(git-commit) Line 42: Unpushed (a1b2c3d)`
- `$(diff-modified) Line 18: Modified`
- `$(check) Line 105: Pushed`

Clicking the status bar item immediately opens the commit comparison selector!

---

### 4. File Diff with Any Commit (Default: Latest Commit `HEAD`)
Compare your current working file against any commit in your Git history:
1. Right-click anywhere in the editor -> select **Git State: Compare File with Commit...** (or click the Compare icon in the editor tab bar).
2. Choose from:
   - **`HEAD` (Latest Commit)** *(pre-selected by default)*
   - **`HEAD~1` (Previous Commit)**
   - **`@{u}` (Remote Tracking Branch)**
   - Recent commits list with commit messages and authors
   - Or type any custom commit hash, branch, or tag
3. Opens VS Code's native side-by-side or inline diff editor with full syntax highlighting.

---

### 5. Line-by-Line & Selection Diff
Need to inspect what an exact line or function looked like in a previous revision?
1. Select the line(s) or position your cursor.
2. Right-click -> **Git State: Compare Selected Line(s) with Commit...**
3. Select the commit (defaults to latest `HEAD`).
4. View an instant comparison of `[Then]` vs `[Now]`.
5. Click **"Open Full Diff in Editor"** to jump directly to those lines inside VS Code's diff viewer.

---

## ⚙️ Configuration & Customization

You can customize colors and behavior in VS Code **Settings** (`Ctrl+,` -> search for `gitStateDiffer`):

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `gitStateDiffer.decorations.showUnpushed` | `boolean` | `true` | Show gutter markers for unpushed commits. |
| `gitStateDiffer.decorations.showModified` | `boolean` | `true` | Show gutter markers for uncommitted modifications. |
| `gitStateDiffer.decorations.showPushed` | `boolean` | `false` | Show gutter markers for pushed code. |
| `gitStateDiffer.decorations.unpushedColor` | `string` | `#a855f7` | Gutter and overview ruler color for unpushed code. |
| `gitStateDiffer.decorations.modifiedColor` | `string` | `#eab308` | Gutter and overview ruler color for modified code. |
| `gitStateDiffer.decorations.pushedColor` | `string` | `#22c55e` | Gutter and overview ruler color for pushed code. |
| `gitStateDiffer.defaultDiffCommit` | `string` | `"HEAD"` | Default commit to compare against (`HEAD`, `HEAD~1`, `@{u}`). |

---

## ⌨️ Contributed Commands

| Command | Title | Location |
| :--- | :--- | :--- |
| `gitStateDiffer.compareFileWithCommit` | Git State: Compare File with Commit... | Editor Context Menu, Editor Title Bar |
| `gitStateDiffer.compareLineWithCommit` | Git State: Compare Selected Line(s) with Commit... | Editor Context Menu, Status Bar |
| `gitStateDiffer.refresh` | Git State: Refresh State | Command Palette (`Ctrl+Shift+P`) |

---

## ❓ Frequently Asked Questions

#### Q: How does the extension know which commits are unpushed?
The extension queries your Git upstream tracking branch (`@{u}` e.g., `origin/main`). It identifies all commits in `@{u}..HEAD` as unpushed. If your local branch does not have an upstream set yet, all local commits are considered unpushed.

#### Q: Does it slow down large repositories?
No! The extension uses native Git porcelain commands (`git blame -p`, `git diff -U0`) executed asynchronously with built-in debouncing (400ms) on typing, ensuring the editor remains buttery-smooth.

---

## 📄 License

This extension is licensed under the MIT License. See the included LICENSE.md for details.
