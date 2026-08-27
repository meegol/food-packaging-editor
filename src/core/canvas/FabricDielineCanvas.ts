import { Canvas, Line, Polygon, FabricText, Point as FabricPoint } from 'fabric';
import { DielineResult } from '../dieline/types';

export interface CanvasOptions {
  showCutLines: boolean;
  showCreaseLines: boolean;
  showLabels: boolean;
  showBleed: boolean;
}

export class FabricDielineCanvas {
  private canvas: Canvas;
  private isDragging = false;
  private lastPosX = 0;
  private lastPosY = 0;
  private currentDieline: DielineResult | null = null;
  private activePanelId: string | null = null;
  private panelObjects: Map<string, Polygon> = new Map();
  private options: CanvasOptions = {
    showCutLines: true,
    showCreaseLines: true,
    showLabels: true,
    showBleed: true,
  };

  private onSelectPanelCallback?: (panelId: string | null) => void;
  private onHoverPanelCallback?: (panelId: string | null) => void;
  private onZoomChangeCallback?: (zoom: number) => void;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = new Canvas(canvasElement, {
      selection: false,
      preserveObjectStacking: true,
      renderOnAddRemove: false,
      backgroundColor: '#0f1319',
    });

    this.setupEventListeners();
  }

  public setCallbacks(callbacks: {
    onSelectPanel?: (panelId: string | null) => void;
    onHoverPanel?: (panelId: string | null) => void;
    onZoomChange?: (zoom: number) => void;
  }) {
    this.onSelectPanelCallback = callbacks.onSelectPanel;
    this.onHoverPanelCallback = callbacks.onHoverPanel;
    this.onZoomChangeCallback = callbacks.onZoomChange;
  }

  public setOptions(options: Partial<CanvasOptions>) {
    this.options = { ...this.options, ...options };
    if (this.currentDieline) {
      this.renderDieline(this.currentDieline);
    }
  }

  public resize(width: number, height: number) {
    this.canvas.setDimensions({ width, height });
    this.canvas.requestRenderAll();
  }

  private setupEventListeners() {
    this.canvas.on('mouse:wheel', (opt) => {
      const evt = opt.e;
      evt.preventDefault();
      evt.stopPropagation();

      const delta = evt.deltaY;
      let zoom = this.canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 5) zoom = 5;
      if (zoom < 0.1) zoom = 0.1;

      const point = new FabricPoint(opt.e.offsetX, opt.e.offsetY);
      this.canvas.zoomToPoint(point, zoom);

      if (this.onZoomChangeCallback) {
        this.onZoomChangeCallback(Math.round(zoom * 100));
      }
    });

    this.canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent;
      if (evt.button === 1 || evt.altKey || evt.shiftKey || !opt.target || opt.target.type !== 'polygon') {
        this.isDragging = true;
        this.canvas.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
      }
    });

    this.canvas.on('mouse:move', (opt) => {
      if (this.isDragging) {
        const evt = opt.e as MouseEvent;
        const vpt = this.canvas.viewportTransform;
        if (vpt) {
          vpt[4] += evt.clientX - this.lastPosX;
          vpt[5] += evt.clientY - this.lastPosY;
          this.canvas.requestRenderAll();
          this.lastPosX = evt.clientX;
          this.lastPosY = evt.clientY;
        }
      }
    });

    this.canvas.on('mouse:up', () => {
      this.isDragging = false;
      this.canvas.setViewportTransform(this.canvas.viewportTransform);
    });
  }

  public renderDieline(dieline: DielineResult) {
    this.currentDieline = dieline;
    this.canvas.clear();
    this.canvas.backgroundColor = '#0f1319';
    this.panelObjects.clear();

    const { lines, panels } = dieline;

    panels.forEach((panel) => {
      const poly = new Polygon(
        panel.polygon.map(p => ({ x: p.x, y: p.y })),
        {
          fill: panel.id === this.activePanelId 
            ? 'rgba(99, 102, 241, 0.25)' 
            : 'rgba(255, 255, 255, 0.02)',
          stroke: panel.id === this.activePanelId ? '#818cf8' : 'transparent',
          strokeWidth: panel.id === this.activePanelId ? 2 : 0,
          selectable: false,
          evented: true,
          hoverCursor: 'pointer',
        }
      );

      (poly as unknown as { panelId: string }).panelId = panel.id;
      this.panelObjects.set(panel.id, poly);

      poly.on('mouseover', () => {
        if (panel.id !== this.activePanelId) {
          poly.set('fill', 'rgba(245, 158, 11, 0.15)');
          this.canvas.requestRenderAll();
        }
        if (this.onHoverPanelCallback) {
          this.onHoverPanelCallback(panel.id);
        }
      });

      poly.on('mouseout', () => {
        if (panel.id !== this.activePanelId) {
          poly.set('fill', 'rgba(255, 255, 255, 0.02)');
          this.canvas.requestRenderAll();
        }
        if (this.onHoverPanelCallback) {
          this.onHoverPanelCallback(null);
        }
      });

      poly.on('mousedown', () => {
        this.selectPanel(panel.id);
      });

      this.canvas.add(poly);
    });

    if (this.options.showCreaseLines) {
      lines
        .filter(l => l.type === 'crease')
        .forEach((l) => {
          const lineObj = new Line([l.x1, l.y1, l.x2, l.y2], {
            stroke: '#10b981',
            strokeWidth: 1.5,
            strokeDashArray: [6, 4],
            selectable: false,
            evented: false,
          });
          this.canvas.add(lineObj);
        });
    }

    if (this.options.showCutLines) {
      lines
        .filter(l => l.type === 'cut')
        .forEach((l) => {
          const lineObj = new Line([l.x1, l.y1, l.x2, l.y2], {
            stroke: '#e53935',
            strokeWidth: 1.5,
            selectable: false,
            evented: false,
          });
          this.canvas.add(lineObj);
        });
    }

    if (this.options.showLabels) {
      panels.forEach((panel) => {
        const textObj = new FabricText(panel.name, {
          left: panel.center.x,
          top: panel.center.y,
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          fill: '#94a3b8',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
        });
        this.canvas.add(textObj);
      });
    }

    this.canvas.requestRenderAll();
  }

  public selectPanel(panelId: string | null) {
    this.activePanelId = panelId;

    this.panelObjects.forEach((poly, id) => {
      if (id === panelId) {
        poly.set({
          fill: 'rgba(99, 102, 241, 0.25)',
          stroke: '#818cf8',
          strokeWidth: 2,
        });
      } else {
        poly.set({
          fill: 'rgba(255, 255, 255, 0.02)',
          stroke: 'transparent',
          strokeWidth: 0,
        });
      }
    });

    this.canvas.requestRenderAll();

    if (this.onSelectPanelCallback) {
      this.onSelectPanelCallback(panelId);
    }
  }

  public focusPanel(panelId: string) {
    if (!this.currentDieline) return;
    const panel = this.currentDieline.panels.find(p => p.id === panelId);
    if (!panel) return;

    this.selectPanel(panelId);

    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();

    // Calculate zoom level to fit panel comfortably with 40% margin
    const scaleX = (canvasWidth * 0.6) / panel.bounds.width;
    const scaleY = (canvasHeight * 0.6) / panel.bounds.height;
    const zoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 3.0);

    const vpt = [
      zoom,
      0,
      0,
      zoom,
      canvasWidth / 2 - panel.center.x * zoom,
      canvasHeight / 2 - panel.center.y * zoom,
    ];

    this.canvas.setViewportTransform(vpt as [number, number, number, number, number, number]);
    this.canvas.requestRenderAll();

    if (this.onZoomChangeCallback) {
      this.onZoomChangeCallback(Math.round(zoom * 100));
    }
  }

  public fitToScreen() {
    if (!this.currentDieline) return;

    const bounds = this.currentDieline.totalBounds;
    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();

    const padding = 80;
    const availableW = Math.max(canvasWidth - padding * 2, 100);
    const availableH = Math.max(canvasHeight - padding * 2, 100);

    const scaleX = availableW / bounds.width;
    const scaleY = availableH / bounds.height;
    const zoom = Math.min(scaleX, scaleY, 2.0);

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    const vpt = [
      zoom,
      0,
      0,
      zoom,
      canvasWidth / 2 - centerX * zoom,
      canvasHeight / 2 - centerY * zoom,
    ];

    this.canvas.setViewportTransform(vpt as [number, number, number, number, number, number]);
    this.canvas.requestRenderAll();

    if (this.onZoomChangeCallback) {
      this.onZoomChangeCallback(Math.round(zoom * 100));
    }
  }

  public zoomIn() {
    const zoom = Math.min(this.canvas.getZoom() * 1.25, 5);
    const center = new FabricPoint(this.canvas.getWidth() / 2, this.canvas.getHeight() / 2);
    this.canvas.zoomToPoint(center, zoom);
    if (this.onZoomChangeCallback) {
      this.onZoomChangeCallback(Math.round(zoom * 100));
    }
  }

  public zoomOut() {
    const zoom = Math.max(this.canvas.getZoom() * 0.8, 0.1);
    const center = new FabricPoint(this.canvas.getWidth() / 2, this.canvas.getHeight() / 2);
    this.canvas.zoomToPoint(center, zoom);
    if (this.onZoomChangeCallback) {
      this.onZoomChangeCallback(Math.round(zoom * 100));
    }
  }

  public destroy() {
    this.canvas.dispose();
  }
}
