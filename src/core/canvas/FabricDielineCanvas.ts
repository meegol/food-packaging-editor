import { Canvas, Line, Polygon, FabricText, FabricImage, Textbox, FabricObject, Point as FabricPoint } from 'fabric';
import { DielineResult, PanelFace, Point } from '../dieline/types';
import { GraphicItem } from '../graphics/types';

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
  private graphicItems: GraphicItem[] = [];
  private graphicObjects: Map<string, FabricObject> = new Map();
  private options: CanvasOptions = {
    showCutLines: true,
    showCreaseLines: true,
    showLabels: true,
    showBleed: true,
  };

  private onSelectPanelCallback?: (panelId: string | null) => void;
  private onHoverPanelCallback?: (panelId: string | null) => void;
  private onZoomChangeCallback?: (zoom: number) => void;
  private onGraphicChangeCallback?: (items: GraphicItem[]) => void;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = new Canvas(canvasElement, {
      selection: false,
      preserveObjectStacking: true,
      renderOnAddRemove: false,
      backgroundColor: 'transparent',
    });

    this.setupEventListeners();
  }

  private getThemeColors() {
    if (typeof window === 'undefined') {
      return {
        labelColor: '#94a3b8',
        activePanelFill: 'rgba(99, 102, 241, 0.25)',
        activePanelStroke: '#818cf8',
        panelHoverFill: 'rgba(245, 158, 11, 0.14)',
        panelDefaultFill: 'rgba(255, 255, 255, 0.02)',
      };
    }
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark-slate';
    const isLight = currentTheme.includes('light') || currentTheme.includes('kraft');
    const style = getComputedStyle(document.documentElement);

    const labelColor = isLight ? '#475569' : '#94a3b8';
    const activePanelFill = style.getPropertyValue('--dieline-panel-active').trim() || (isLight ? 'rgba(79, 70, 229, 0.16)' : 'rgba(99, 102, 241, 0.25)');
    const activePanelStroke = style.getPropertyValue('--dieline-panel-active-stroke').trim() || (isLight ? '#4f46e5' : '#818cf8');
    const panelHoverFill = style.getPropertyValue('--dieline-panel-hover').trim() || (isLight ? 'rgba(79, 70, 229, 0.08)' : 'rgba(245, 158, 11, 0.14)');
    const panelDefaultFill = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)';

    return {
      labelColor,
      activePanelFill,
      activePanelStroke,
      panelHoverFill,
      panelDefaultFill,
    };
  }

  public updateTheme() {
    if (this.currentDieline) {
      this.renderDieline(this.currentDieline);
    } else {
      this.canvas.requestRenderAll();
    }
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
      const isGraphic = opt.target && (
        opt.target.type === 'image' ||
        opt.target.type === 'textbox' ||
        opt.target.type === 'text' ||
        (opt.target as unknown as { graphicId?: string }).graphicId !== undefined
      );

      if (!isGraphic && (evt.button === 1 || evt.altKey || evt.shiftKey || !opt.target || opt.target.type === 'polygon')) {
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

  private async renderGraphics() {
    this.graphicObjects.clear();
    if (!this.currentDieline) return;

    for (const item of this.graphicItems) {
      const targetPanel = this.currentDieline.panels.find(p => p.id === item.panelId);
      if (!targetPanel) continue;

      try {
        if (item.type === 'text') {
          const initialLeft = item.x ?? targetPanel.center.x;
          const initialTop = item.y ?? targetPanel.center.y;
          const panelWidth = targetPanel.bounds.width;
          const maxW = Math.max(Math.min(panelWidth * 0.85, 280), 80);

          const textObj = new Textbox(item.text || 'Food Packaging Label', {
            left: initialLeft,
            top: initialTop,
            width: maxW,
            fontSize: item.fontSize || 15,
            fontFamily: item.fontFamily || 'Inter, sans-serif',
            fontWeight: (item.fontWeight || '600') as string,
            fill: item.fill || '#f8fafc',
            textAlign: item.textAlign || 'center',
            lineHeight: item.lineHeight || 1.25,
            scaleX: item.scaleX ?? 1,
            scaleY: item.scaleY ?? 1,
            angle: item.angle ?? 0,
            originX: 'center',
            originY: 'center',
            cornerColor: '#6366f1',
            cornerStrokeColor: '#ffffff',
            borderColor: '#818cf8',
            cornerSize: 8,
            transparentCorners: false,
            cornerStyle: 'circle',
            selectable: true,
            evented: true,
          });

          if (item.clipToPanel) {
            const clipPoly = new Polygon(
              targetPanel.polygon.map(p => ({ x: p.x, y: p.y })),
              { absolutePositioned: true }
            );
            textObj.clipPath = clipPoly;
          } else {
            textObj.clipPath = undefined;
          }

          (textObj as unknown as { graphicId: string }).graphicId = item.id;
          this.graphicObjects.set(item.id, textObj);

          textObj.on('modified', () => {
            item.x = textObj.left;
            item.y = textObj.top;
            item.scaleX = textObj.scaleX;
            item.scaleY = textObj.scaleY;
            item.angle = textObj.angle;
            item.text = textObj.text;
            if (this.onGraphicChangeCallback) {
              this.onGraphicChangeCallback([...this.graphicItems]);
            }
          });

          this.canvas.add(textObj);
        } else {
          // Images, vector SVG icons, barcodes, and QR codes
          if (!item.src) continue;

          const fabricImg = await FabricImage.fromURL(item.src, {
            crossOrigin: 'anonymous',
          });

          const initialLeft = item.x ?? targetPanel.center.x;
          const initialTop = item.y ?? targetPanel.center.y;

          let sX = item.scaleX ?? 1;
          let sY = item.scaleY ?? 1;
          if (item.scaleX === undefined) {
            let fitRatio = 0.75;
            if (item.type === 'icon') fitRatio = 0.35;
            if (item.type === 'barcode') fitRatio = 0.65;
            if (item.type === 'qrcode') fitRatio = 0.40;

            const maxW = targetPanel.bounds.width * fitRatio;
            const maxH = targetPanel.bounds.height * fitRatio;
            const scaleFit = Math.min(maxW / (fabricImg.width || 1), maxH / (fabricImg.height || 1), 1);
            sX = scaleFit;
            sY = scaleFit;
            item.scaleX = sX;
            item.scaleY = sY;
          }

          fabricImg.set({
            left: initialLeft,
            top: initialTop,
            scaleX: sX,
            scaleY: sY,
            angle: item.angle ?? 0,
            originX: 'center',
            originY: 'center',
            cornerColor: '#6366f1',
            cornerStrokeColor: '#ffffff',
            borderColor: '#818cf8',
            cornerSize: 8,
            transparentCorners: false,
            cornerStyle: 'circle',
            selectable: true,
            evented: true,
          });

          if (item.clipToPanel) {
            const clipPoly = new Polygon(
              targetPanel.polygon.map(p => ({ x: p.x, y: p.y })),
              { absolutePositioned: true }
            );
            fabricImg.clipPath = clipPoly;
          } else {
            fabricImg.clipPath = undefined;
          }

          (fabricImg as unknown as { graphicId: string }).graphicId = item.id;
          this.graphicObjects.set(item.id, fabricImg);

          fabricImg.on('modified', () => {
            item.x = fabricImg.left;
            item.y = fabricImg.top;
            item.scaleX = fabricImg.scaleX;
            item.scaleY = fabricImg.scaleY;
            item.angle = fabricImg.angle;
            if (this.onGraphicChangeCallback) {
              this.onGraphicChangeCallback([...this.graphicItems]);
            }
          });

          this.canvas.add(fabricImg);
        }
      } catch (err) {
        console.error('Failed to load graphic on canvas:', err);
      }
    }
  }

  public async renderDieline(dieline: DielineResult) {
    this.currentDieline = dieline;
    this.canvas.clear();
    this.canvas.backgroundColor = 'transparent';
    const colors = this.getThemeColors();
    this.panelObjects.clear();

    const { lines, panels } = dieline;

    panels.forEach((panel) => {
      const poly = new Polygon(
        panel.polygon.map(p => ({ x: p.x, y: p.y })),
        {
          fill: panel.id === this.activePanelId 
            ? colors.activePanelFill 
            : colors.panelDefaultFill,
          stroke: panel.id === this.activePanelId ? colors.activePanelStroke : 'transparent',
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
          poly.set('fill', colors.panelHoverFill);
          this.canvas.requestRenderAll();
        }
        if (this.onHoverPanelCallback) {
          this.onHoverPanelCallback(panel.id);
        }
      });

      poly.on('mouseout', () => {
        if (panel.id !== this.activePanelId) {
          poly.set('fill', colors.panelDefaultFill);
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

    await this.renderGraphics();

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
          fill: colors.labelColor,
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

  public async setGraphics(items: GraphicItem[]): Promise<void> {
    this.graphicItems = [...items];
    if (this.currentDieline) {
      await this.renderDieline(this.currentDieline);
    }
  }

  public async addGraphic(item: GraphicItem): Promise<void> {
    this.graphicItems.push(item);
    if (this.currentDieline) {
      await this.renderDieline(this.currentDieline);
    }
  }

  public async removeGraphic(id: string): Promise<void> {
    this.graphicItems = this.graphicItems.filter(g => g.id !== id);
    if (this.currentDieline) {
      await this.renderDieline(this.currentDieline);
    }
  }

  public async updateGraphic(updated: GraphicItem): Promise<void> {
    const idx = this.graphicItems.findIndex(g => g.id === updated.id);
    if (idx !== -1) {
      this.graphicItems[idx] = { ...updated };
      if (this.currentDieline) {
        await this.renderDieline(this.currentDieline);
      }
    }
  }

  public async reorderGraphic(id: string, direction: 'up' | 'down'): Promise<void> {
    const idx = this.graphicItems.findIndex(g => g.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx < this.graphicItems.length - 1) {
      const temp = this.graphicItems[idx];
      this.graphicItems[idx] = this.graphicItems[idx + 1];
      this.graphicItems[idx + 1] = temp;
    } else if (direction === 'down' && idx > 0) {
      const temp = this.graphicItems[idx];
      this.graphicItems[idx] = this.graphicItems[idx - 1];
      this.graphicItems[idx - 1] = temp;
    }
    if (this.currentDieline) {
      await this.renderDieline(this.currentDieline);
    }
    if (this.onGraphicChangeCallback) {
      this.onGraphicChangeCallback([...this.graphicItems]);
    }
  }

  public setOnGraphicChange(cb: (items: GraphicItem[]) => void) {
    this.onGraphicChangeCallback = cb;
  }

  public selectPanel(panelId: string | null) {
    this.activePanelId = panelId;
    const colors = this.getThemeColors();

    this.panelObjects.forEach((poly, id) => {
      if (id === panelId) {
        poly.set({
          fill: colors.activePanelFill,
          stroke: colors.activePanelStroke,
          strokeWidth: 2,
        });
      } else {
        poly.set({
          fill: colors.panelDefaultFill,
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

  public getCanvasPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getElement().getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const vpt = this.canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    return {
      x: (screenX - vpt[4]) / vpt[0],
      y: (screenY - vpt[5]) / vpt[3],
    };
  }

  public isPointInPolygon(p: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > p.y) !== (yj > p.y)) &&
        (p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  public findPanelAt(clientX: number, clientY: number): PanelFace | null {
    if (!this.currentDieline) return null;
    const pt = this.getCanvasPoint(clientX, clientY);

    for (const panel of this.currentDieline.panels) {
      // Bounding box pre-check for speed
      if (
        pt.x >= panel.bounds.x - 5 &&
        pt.x <= panel.bounds.x + panel.bounds.width + 5 &&
        pt.y >= panel.bounds.y - 5 &&
        pt.y <= panel.bounds.y + panel.bounds.height + 5
      ) {
        if (this.isPointInPolygon(pt, panel.polygon)) {
          return panel;
        }
      }
    }
    return null;
  }

  public destroy() {
    this.canvas.dispose();
  }
}
