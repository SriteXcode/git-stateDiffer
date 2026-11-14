# Change Log

All notable changes to the **Git State & Revision Differ** extension will be documented in this file.

## [0.1.0] - 2026-11-14

### Initial Release
- **Visual Git State Differentiation**:
  - Gutter decorations and overview ruler markers for **Committed (Unpushed)** code (purple).
  - Gutter decorations and overview ruler markers for **Modified (Uncommitted)** code (yellow/amber).
  - Optional green indicators for **Pushed** code (configurable via settings).
- **Rich Line Hover**:
  - Displays state badges (`🟢 Pushed`, `🟣 Committed (Unpushed)`, `🟡 Modified (Uncommitted)`).
  - Shows commit hash, author, commit date, and summary.
  - Interactive quick action links inside the hover card.
- **Dynamic Status Bar**:
  - Real-time indicator displaying the Git state of the line at the active cursor position.
- **Diff Features**:
  - **Compare File with Commit...**: Diff the entire file with any commit (default: `HEAD` latest commit) in VS Code's native diff viewer.
  - **Compare Line(s) with Commit...**: Inspect differences for specific line(s) against any commit with instant preview and jump-to-line capability.
- **Automated CI/CD**:
  - GitHub Actions automated publishing pipeline to VS Code Marketplace on version tag release.
