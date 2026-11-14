import * as vscode from 'vscode';

    /**
     * Creates an SVG Data URI for gutter markers.
     */
    function createGutterSvg(color: string, shape: 'bar' | 'circle' = 'bar'): vscode.Uri {
      let svg: string;
      if (shape === 'bar') {
        svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 16" width="4" height="16">
          <rect x="0" y="0" width="3" height="16" rx="1.5" fill="${color}" />
        </svg>`;
      } else {
        svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16"
        height="16">
          <circle cx="8" cy="8" r="4" fill="${color}" />
        </svg>`;
      }
      return vscode.Uri.parse(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
    }

    export interface DecorationSettings {
      showUnpushed: boolean;
      showModified: boolean;
      showPushed: boolean;
      unpushedColor: string;
      modifiedColor: string;
      pushedColor: string;
    }

    export function getDecorationSettings(): DecorationSettings {
      const config = vscode.workspace.getConfiguration('gitStateDiffer');
      return {
        showUnpushed: config.get<boolean>('decorations.showUnpushed', true),
        showModified: config.get<boolean>('decorations.showModified', true),
        showPushed: config.get<boolean>('decorations.showPushed', false),
        unpushedColor: config.get<string>('decorations.unpushedColor', '#a855f7'),
        modifiedColor: config.get<string>('decorations.modifiedColor', '#eab308'),
        pushedColor: config.get<string>('decorations.pushedColor', '#22c55e'),
      };
    }

    export function createDecorationTypes(settings: DecorationSettings) {
      const unpushedGutterUri = createGutterSvg(settings.unpushedColor, 'bar');
      const modifiedGutterUri = createGutterSvg(settings.modifiedColor, 'bar');
      const pushedGutterUri = createGutterSvg(settings.pushedColor, 'circle');

      const unpushedType = vscode.window.createTextEditorDecorationType({
        gutterIconPath: unpushedGutterUri,
        gutterIconSize: 'contain',
        overviewRulerColor: settings.unpushedColor,
        overviewRulerLane: vscode.OverviewRulerLane.Left,
      });

      const modifiedType = vscode.window.createTextEditorDecorationType({
        gutterIconPath: modifiedGutterUri,
        gutterIconSize: 'contain',
        overviewRulerColor: settings.modifiedColor,
        overviewRulerLane: vscode.OverviewRulerLane.Right,
      });

      const pushedType = vscode.window.createTextEditorDecorationType({
        gutterIconPath: pushedGutterUri,
        gutterIconSize: 'contain',
        overviewRulerColor: settings.pushedColor,
        overviewRulerLane: vscode.OverviewRulerLane.Center,
      });

      return { unpushedType, modifiedType, pushedType };
    }