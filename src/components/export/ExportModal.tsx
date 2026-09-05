import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Layers,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Download,
  Settings,
  ShieldCheck,
  Cpu,
  Printer,
  Sparkles,
} from 'lucide-react';
import { DielineResult } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';
import {
  PdfExportOptions,
  SvgExportOptions,
  RasterExportOptions,
  PdfScaleMode,
} from '../../core/export/exportTypes';
import { downloadDielinePdf } from '../../core/export/dielinePdfExport';
import { downloadDielineSvg } from '../../core/export/dielineSvgExport';
import { downloadDielineRaster } from '../../core/export/dielineRasterExport';
import { calculatePackagingSpecSheet } from '../../core/export/specSheetCalculator';
import { exportProjectFile } from '../../core/storage/projectStorage';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dieline: DielineResult;
  graphics: GraphicItem[];
  themeId: string;
}

type TabType = 'pdf' | 'svg' | 'raster' | 'spec' | 'json';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  dieline,
  graphics,
  themeId,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // PDF Export Settings
  const [pdfOptions, setPdfOptions] = useState<PdfExportOptions>({
    scaleMode: '1:1',
    includeCutLines: true,
    includeCreaseLines: true,
    includeDimensions: true,
    includeArtwork: true,
    includeRegistrationMarks: true,
    includeTitleBlock: true,
    unit: 'mm',
  });

  // SVG Export Settings
  const [svgOptions, setSvgOptions] = useState<SvgExportOptions>({
    includeCutLines: true,
    includeCreaseLines: true,
    includeDimensions: true,
    includeArtwork: true,
    includeRegistrationMarks: true,
    includeFaceLabels: true,
    marginMm: 15,
  });

  // Raster Export Settings
  const [rasterOptions, setRasterOptions] = useState<RasterExportOptions>({
    dpi: 300,
    format: 'png',
    includeArtwork: true,
    includeLines: true,
    backgroundColor: '#ffffff',
  });

  // Calculate real-time spec sheet metrics
  const specSheet = useMemo(
    () => calculatePackagingSpecSheet(dieline, graphics),
    [dieline, graphics]
  );

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      setExportMessage('Generating 1:1 Vector CAD PDF and Spec Sheet...');
      await downloadDielinePdf(dieline, graphics, pdfOptions);
      setExportMessage('PDF successfully generated!');
      setTimeout(() => setExportMessage(null), 2500);
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportMessage('Export failed. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSvg = () => {
    try {
      setIsExporting(true);
      setExportMessage('Generating layer-separated CAD SVG...');
      downloadDielineSvg(dieline, graphics, svgOptions);
      setExportMessage('SVG successfully downloaded!');
      setTimeout(() => setExportMessage(null), 2500);
    } catch (err) {
      console.error('SVG export failed:', err);
      setExportMessage('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadRaster = async () => {
    try {
      setIsExporting(true);
      setExportMessage(`Rendering ${rasterOptions.dpi} DPI print proof...`);
      await downloadDielineRaster(dieline, graphics, rasterOptions);
      setExportMessage('Raster proof successfully rendered!');
      setTimeout(() => setExportMessage(null), 2500);
    } catch (err) {
      console.error('Raster export failed:', err);
      setExportMessage('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJson = () => {
    exportProjectFile(dieline.templateId, dieline.dimensions, graphics, themeId);
    setExportMessage('Project JSON file downloaded!');
    setTimeout(() => setExportMessage(null), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="export-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="export-modal-header">
          <div className="export-modal-title-wrap">
            <div className="export-modal-icon-badge">
              <Printer size={18} />
            </div>
            <div>
              <h2 className="export-modal-title">Production Export Suite</h2>
              <p className="export-modal-subtitle">
                Print-ready 1:1 CAD PDF, layer-separated SVG, and high-DPI raster proofs
              </p>
            </div>
          </div>
          <button className="export-modal-close" onClick={onClose} title="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="export-modal-tabs">
          <button
            className={`export-tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
            onClick={() => setActiveTab('pdf')}
          >
            <FileText size={15} />
            <span>1:1 Vector CAD PDF</span>
          </button>
          <button
            className={`export-tab-btn ${activeTab === 'svg' ? 'active' : ''}`}
            onClick={() => setActiveTab('svg')}
          >
            <Layers size={15} />
            <span>Layered CAD SVG</span>
          </button>
          <button
            className={`export-tab-btn ${activeTab === 'raster' ? 'active' : ''}`}
            onClick={() => setActiveTab('raster')}
          >
            <ImageIcon size={15} />
            <span>300 DPI Proof</span>
          </button>
          <button
            className={`export-tab-btn ${activeTab === 'spec' ? 'active' : ''}`}
            onClick={() => setActiveTab('spec')}
          >
            <Cpu size={15} />
            <span>Technical BOM</span>
          </button>
          <button
            className={`export-tab-btn ${activeTab === 'json' ? 'active' : ''}`}
            onClick={() => setActiveTab('json')}
          >
            <Settings size={15} />
            <span>Project JSON</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="export-modal-body">
          {/* TAB 1: VECTOR CAD PDF */}
          {activeTab === 'pdf' && (
            <div className="export-tab-pane">
              <div className="export-pane-banner">
                <div className="banner-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <strong>Industrial Packaging Standard (FEFCO / ECMA)</strong>
                  <p>
                    Outputs precise millimeter vector paths for laser-cut steel rule dies and digital
                    die-cutters (Zünd, Kongsberg, ESKO). Includes technical BOM on Page 2.
                  </p>
                </div>
              </div>

              <div className="export-settings-grid">
                {/* Scale Mode */}
                <div className="export-setting-group">
                  <label className="export-group-label">Physical Scale & Sheet Format</label>
                  <div className="export-radio-options">
                    <label className="export-radio-label">
                      <input
                        type="radio"
                        name="pdfScale"
                        value="1:1"
                        checked={pdfOptions.scaleMode === '1:1'}
                        onChange={() => setPdfOptions((o) => ({ ...o, scaleMode: '1:1' }))}
                      />
                      <span>
                        <strong>1:1 True Scale (Custom Envelope)</strong> — Exact 1 mm = 1 mm CAD output
                      </span>
                    </label>
                    <label className="export-radio-label">
                      <input
                        type="radio"
                        name="pdfScale"
                        value="fit-a3"
                        checked={pdfOptions.scaleMode === 'fit-a3'}
                        onChange={() =>
                          setPdfOptions((o) => ({ ...o, scaleMode: 'fit-a3' as PdfScaleMode }))
                        }
                      />
                      <span>
                        <strong>Fit to ISO A3 (420 × 297 mm)</strong> — Office Tabloid/A3 proofing
                      </span>
                    </label>
                    <label className="export-radio-label">
                      <input
                        type="radio"
                        name="pdfScale"
                        value="fit-a4"
                        checked={pdfOptions.scaleMode === 'fit-a4'}
                        onChange={() =>
                          setPdfOptions((o) => ({ ...o, scaleMode: 'fit-a4' as PdfScaleMode }))
                        }
                      />
                      <span>
                        <strong>Fit to ISO A4 (297 × 210 mm)</strong> — Standard desktop printer
                      </span>
                    </label>
                  </div>
                </div>

                {/* Layer Toggles */}
                <div className="export-setting-group">
                  <label className="export-group-label">Production Layer Separation</label>
                  <div className="export-checkbox-grid">
                    <button
                      type="button"
                      className="export-toggle-item"
                      onClick={() =>
                        setPdfOptions((o) => ({ ...o, includeCutLines: !o.includeCutLines }))
                      }
                    >
                      {pdfOptions.includeCutLines ? (
                        <CheckSquare size={16} className="text-red" />
                      ) : (
                        <Square size={16} />
                      )}
                      <span>
                        Cut Lines (Solid Red <span className="swatch-cut" />)
                      </span>
                    </button>

                    <button
                      type="button"
                      className="export-toggle-item"
                      onClick={() =>
                        setPdfOptions((o) => ({
                          ...o,
                          includeCreaseLines: !o.includeCreaseLines,
                        }))
                      }
                    >
                      {pdfOptions.includeCreaseLines ? (
                        <CheckSquare size={16} className="text-green" />
                      ) : (
                        <Square size={16} />
                      )}
                      <span>
                        Crease Lines (Dashed Green <span className="swatch-crease" />)
                      </span>
                    </button>

                    <button
                      type="button"
                      className="export-toggle-item"
                      onClick={() =>
                        setPdfOptions((o) => ({
                          ...o,
                          includeDimensions: !o.includeDimensions,
                        }))
                      }
                    >
                      {pdfOptions.includeDimensions ? <CheckSquare size={16} /> : <Square size={16} />}
                      <span>Dimension Callouts & Face Names</span>
                    </button>

                    <button
                      type="button"
                      className="export-toggle-item"
                      onClick={() =>
                        setPdfOptions((o) => ({ ...o, includeArtwork: !o.includeArtwork }))
                      }
                    >
                      {pdfOptions.includeArtwork ? <CheckSquare size={16} /> : <Square size={16} />}
                      <span>Artwork & Regulatory Badges Layer</span>
                    </button>

                    <button
                      type="button"
                      className="export-toggle-item"
                      onClick={() =>
                        setPdfOptions((o) => ({
                          ...o,
                          includeRegistrationMarks: !o.includeRegistrationMarks,
                        }))
                      }
                    >
                      {pdfOptions.includeRegistrationMarks ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                      <span>4-Corner Optical Registration Marks</span>
                    </button>

                    <button
                      type="button"
                      className="export-toggle-item"
                      onClick={() =>
                        setPdfOptions((o) => ({
                          ...o,
                          includeTitleBlock: !o.includeTitleBlock,
                        }))
                      }
                    >
                      {pdfOptions.includeTitleBlock ? <CheckSquare size={16} /> : <Square size={16} />}
                      <span>Engineering Title Block & Legend</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="export-action-bar">
                <div className="export-spec-summary">
                  <span>
                    Blank: <strong>{specSheet.blankWidthMm} × {specSheet.blankHeightMm} mm</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Cut Rule: <strong>{(specSheet.totalCutPerimeterMm / 1000).toFixed(2)} m</strong>
                  </span>
                </div>
                <button
                  className="export-primary-btn"
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                >
                  <Download size={15} />
                  <span>{isExporting ? 'Generating PDF...' : 'Download Vector CAD PDF'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LAYERED SVG */}
          {activeTab === 'svg' && (
            <div className="export-tab-pane">
              <div className="export-pane-banner">
                <div className="banner-icon">
                  <Layers size={20} />
                </div>
                <div>
                  <strong>Direct Vector CAD / Adobe Illustrator Import</strong>
                  <p>
                    Clean, grouped SVG with physical millimeter units (`&lt;g id="cut-lines"&gt;`, `&lt;g id="crease-lines"&gt;`, `&lt;g id="artwork"&gt;`).
                  </p>
                </div>
              </div>

              <div className="export-settings-grid">
                <div className="export-setting-group">
                  <label className="export-group-label">Included SVG Layers</label>
                  <div className="export-checkbox-grid">
                    <button
                      type="button"
                      className="export-toggle-item"
                      onClick={() =>
                        setSvgOptions((o) => ({ ...o, includeCutLines: !o.includeCutLines }))
                      }
                    >
                      {svgOptions.includeCutLines ? (
                        <CheckSquare size={16} className="text-red" />
                      ) : (
                        <Square size={16} />
                      )}
                      <span>Solid Cut Lines (#ef4444)</span>
                    </button>

                    <button
                      type="button"
                      className="export-toggle-item"
                      onClick={() =>
                        setSvgOptions((o) => ({
                          ...o,
                          includeCreaseLines: !o.includeCreaseLines,
                        }))
                      }
                    >
                      {svgOptions.includeCreaseLines ? (
                        <CheckSquare size={16} className="text-green" />
                      ) : (
                        <Square size={16} />
                      )}
                      <span>Dashed Crease Lines (#22c55e)</span>
                    </button>

                    <button
                      type="button"
                      className="export-toggle-item"
                      onClick={() =>
                        setSvgOptions((o) => ({ ...o, includeArtwork: !o.includeArtwork }))
                      }
                    >
                      {svgOptions.includeArtwork ? <CheckSquare size={16} /> : <Square size={16} />}
                      <span>Placed Artwork & Typography</span>
                    </button>

                    <button
                      type="button"
                      className="export-toggle-item"
                      onClick={() =>
                        setSvgOptions((o) => ({
                          ...o,
                          includeDimensions: !o.includeDimensions,
                        }))
                      }
                    >
                      {svgOptions.includeDimensions ? <CheckSquare size={16} /> : <Square size={16} />}
                      <span>Dimension Lines & Measurements</span>
                    </button>

                    <button
                      type="button"
                      className="export-toggle-item"
                      onClick={() =>
                        setSvgOptions((o) => ({
                          ...o,
                          includeFaceLabels: !o.includeFaceLabels,
                        }))
                      }
                    >
                      {svgOptions.includeFaceLabels ? <CheckSquare size={16} /> : <Square size={16} />}
                      <span>Face Panel Labels</span>
                    </button>

                    <button
                      type="button"
                      className="export-toggle-item"
                      onClick={() =>
                        setSvgOptions((o) => ({
                          ...o,
                          includeRegistrationMarks: !o.includeRegistrationMarks,
                        }))
                      }
                    >
                      {svgOptions.includeRegistrationMarks ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                      <span>Registration Crosshairs</span>
                    </button>
                  </div>
                </div>

                <div className="export-setting-group">
                  <label className="export-group-label">Artboard Margin Padding (mm)</label>
                  <div className="export-input-row">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={svgOptions.marginMm}
                      onChange={(e) =>
                        setSvgOptions((o) => ({ ...o, marginMm: Number(e.target.value) }))
                      }
                    />
                    <span className="export-value-badge">{svgOptions.marginMm} mm</span>
                  </div>
                </div>
              </div>

              <div className="export-action-bar">
                <div className="export-spec-summary">
                  <span>
                    Format: <strong>Standalone Vector SVG</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Target: <strong>Illustrator / Corel / CAD Cutter</strong>
                  </span>
                </div>
                <button
                  className="export-primary-btn"
                  onClick={handleDownloadSvg}
                  disabled={isExporting}
                >
                  <Download size={15} />
                  <span>{isExporting ? 'Generating SVG...' : 'Download Layered SVG'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 300 DPI RASTER PROOF */}
          {activeTab === 'raster' && (
            <div className="export-tab-pane">
              <div className="export-pane-banner">
                <div className="banner-icon">
                  <Sparkles size={20} />
                </div>
                <div>
                  <strong>High-DPI Print Proof & Digital Sign-Off</strong>
                  <p>
                    Produces a crisp raster render at true printing resolution (300 DPI or 600 DPI) for client reviews and prepress proofing.
                  </p>
                </div>
              </div>

              <div className="export-settings-grid">
                {/* DPI Selection */}
                <div className="export-setting-group">
                  <label className="export-group-label">Resolution (Dots Per Inch)</label>
                  <div className="export-pill-selector">
                    <button
                      type="button"
                      className={`export-pill-btn ${rasterOptions.dpi === 150 ? 'active' : ''}`}
                      onClick={() => setRasterOptions((o) => ({ ...o, dpi: 150 }))}
                    >
                      150 DPI (Screen / Draft)
                    </button>
                    <button
                      type="button"
                      className={`export-pill-btn ${rasterOptions.dpi === 300 ? 'active' : ''}`}
                      onClick={() => setRasterOptions((o) => ({ ...o, dpi: 300 }))}
                    >
                      300 DPI (Commercial Print Ready)
                    </button>
                    <button
                      type="button"
                      className={`export-pill-btn ${rasterOptions.dpi === 600 ? 'active' : ''}`}
                      onClick={() => setRasterOptions((o) => ({ ...o, dpi: 600 }))}
                    >
                      600 DPI (Ultra Fine Press Grade)
                    </button>
                  </div>
                </div>

                {/* Format & Background */}
                <div className="export-setting-group">
                  <label className="export-group-label">Image Format & Background</label>
                  <div className="export-radio-options">
                    <label className="export-radio-label">
                      <input
                        type="radio"
                        name="rasterFormat"
                        value="png"
                        checked={rasterOptions.format === 'png'}
                        onChange={() =>
                          setRasterOptions((o) => ({ ...o, format: 'png', backgroundColor: 'transparent' }))
                        }
                      />
                      <span>
                        <strong>PNG (Transparent Background)</strong> — Ideal for placing onto mockups
                      </span>
                    </label>
                    <label className="export-radio-label">
                      <input
                        type="radio"
                        name="rasterFormat"
                        value="jpeg"
                        checked={rasterOptions.format === 'jpeg'}
                        onChange={() =>
                          setRasterOptions((o) => ({ ...o, format: 'jpeg', backgroundColor: '#ffffff' }))
                        }
                      />
                      <span>
                        <strong>JPEG (Clean White Background)</strong> — Compact digital proof
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="export-action-bar">
                <div className="export-spec-summary">
                  <span>
                    Output Pixel Dimensions:{' '}
                    <strong>
                      {Math.round(((specSheet.blankWidthMm + 30) / 25.4) * rasterOptions.dpi)} ×{' '}
                      {Math.round(((specSheet.blankHeightMm + 30) / 25.4) * rasterOptions.dpi)} px
                    </strong>
                  </span>
                </div>
                <button
                  className="export-primary-btn"
                  onClick={handleDownloadRaster}
                  disabled={isExporting}
                >
                  <Download size={15} />
                  <span>{isExporting ? 'Rendering Proof...' : `Download ${rasterOptions.dpi} DPI Proof`}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: TECHNICAL SPEC SHEET / BOM */}
          {activeTab === 'spec' && (
            <div className="export-tab-pane">
              <div className="bom-metrics-grid">
                <div className="bom-card">
                  <span className="bom-card-label">Flat Blank Size</span>
                  <span className="bom-card-value">
                    {specSheet.blankWidthMm} × {specSheet.blankHeightMm} mm
                  </span>
                  <span className="bom-card-hint">Total rectangular cutting envelope</span>
                </div>

                <div className="bom-card">
                  <span className="bom-card-label">Net Surface Area</span>
                  <span className="bom-card-value">{specSheet.netSurfaceAreaSqCm} cm²</span>
                  <span className="bom-card-hint">{specSheet.netSurfaceAreaSqMm} mm² net substrate</span>
                </div>

                <div className="bom-card">
                  <span className="bom-card-label">Nesting Area Efficiency</span>
                  <span className="bom-card-value">{specSheet.nestingEfficiencyPercent}%</span>
                  <span className="bom-card-hint">Substrate yield ratio</span>
                </div>

                <div className="bom-card">
                  <span className="bom-card-label">Steel Rule Cut Perimeter</span>
                  <span className="bom-card-value">
                    {(specSheet.totalCutPerimeterMm / 1000).toFixed(2)} m
                  </span>
                  <span className="bom-card-hint">{specSheet.totalCutPerimeterMm} mm linear knife die</span>
                </div>

                <div className="bom-card">
                  <span className="bom-card-label">Crease Scoring Perimeter</span>
                  <span className="bom-card-value">
                    {(specSheet.totalCreasePerimeterMm / 1000).toFixed(2)} m
                  </span>
                  <span className="bom-card-hint">{specSheet.totalCreasePerimeterMm} mm matrix wheel</span>
                </div>

                <div className="bom-card">
                  <span className="bom-card-label">Estimated Blank Weight</span>
                  <span className="bom-card-value">~{specSheet.estimatedWeightGrams} g</span>
                  <span className="bom-card-hint">Based on 320 GSM FBB board</span>
                </div>
              </div>

              <div className="bom-sub-table">
                <div className="bom-row">
                  <span className="bom-key">Packaging Template</span>
                  <span className="bom-val">{specSheet.templateName} ({specSheet.templateId})</span>
                </div>
                <div className="bom-row">
                  <span className="bom-key">Substrate Grade Recommendation</span>
                  <span className="bom-val">{specSheet.boardRecommendation}</span>
                </div>
                <div className="bom-row">
                  <span className="bom-key">Total Panels & Flaps</span>
                  <span className="bom-val">{specSheet.panelCount} panels ({specSheet.flapCount} glue & dust flaps)</span>
                </div>
                <div className="bom-row">
                  <span className="bom-key">Compliance Standard</span>
                  <span className="bom-val">FDA 21 CFR 176.170 / EU 1935/2004 Food Contact Compliant</span>
                </div>
              </div>

              <div className="export-action-bar">
                <div className="export-spec-summary">
                  <span>
                    Technical BOM is automatically included on <strong>Page 2 of the Vector CAD PDF</strong>
                  </span>
                </div>
                <button
                  className="export-primary-btn"
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                >
                  <Download size={15} />
                  <span>Download Spec Sheet (PDF)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: PORTABLE PROJECT JSON */}
          {activeTab === 'json' && (
            <div className="export-tab-pane">
              <div className="export-pane-banner">
                <div className="banner-icon">
                  <Settings size={20} />
                </div>
                <div>
                  <strong>Zero-Registration Project Portability</strong>
                  <p>
                    Download complete design project state as a standalone `.json` file. You can restore your project on any computer at any time without needing an account.
                  </p>
                </div>
              </div>

              <div className="json-export-summary-box">
                <div className="bom-row">
                  <span className="bom-key">Active Template</span>
                  <span className="bom-val">{dieline.templateName}</span>
                </div>
                <div className="bom-row">
                  <span className="bom-key">Dimensions</span>
                  <span className="bom-val">
                    L {dieline.dimensions.length}mm × W {dieline.dimensions.width}mm × D {dieline.dimensions.depth}mm
                  </span>
                </div>
                <div className="bom-row">
                  <span className="bom-key">Placed Graphic Items</span>
                  <span className="bom-val">{graphics.length} branding assets</span>
                </div>
                <div className="bom-row">
                  <span className="bom-key">Selected UI Theme</span>
                  <span className="bom-val">{themeId}</span>
                </div>
              </div>

              <div className="export-action-bar">
                <div className="export-spec-summary">
                  <span>Portable JSON format with complete geometry & graphics metadata</span>
                </div>
                <button className="export-primary-btn" onClick={handleDownloadJson}>
                  <Download size={15} />
                  <span>Download Project File (.json)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Notification Toast */}
        {exportMessage && (
          <div className="export-status-toast">
            <span>{exportMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
