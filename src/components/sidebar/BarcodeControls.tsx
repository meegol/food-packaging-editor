import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { QrCode, Barcode as BarcodeIcon, Plus, ShieldCheck, AlertCircle } from 'lucide-react';
import { PanelFace } from '../../core/dieline/types';
import { GraphicItem } from '../../core/graphics/types';

interface BarcodeControlsProps {
  panels: PanelFace[];
  activePanelId: string | null;
  onAddGraphic: (item: GraphicItem) => void;
  onSelectPanel: (panelId: string) => void;
}

type CodeMode = 'barcode' | 'qrcode';
type BarcodeFormat = 'CODE128' | 'EAN13' | 'UPC';

export const BarcodeControls: React.FC<BarcodeControlsProps> = ({
  panels,
  activePanelId,
  onAddGraphic,
  onSelectPanel,
}) => {
  const [mode, setMode] = useState<CodeMode>('barcode');
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('EAN13');
  const [barcodeValue, setBarcodeValue] = useState('5901234123457');
  const [qrContent, setQrContent] = useState('https://food-packaging-editor.dev/menu');
  const [qrErrorCorrection, setQrErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [clipToPanel, setClipToPanel] = useState(true);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const effectivePanelId = activePanelId || (panels[0]?.id ?? '');

  // Generate Barcode Preview
  useEffect(() => {
    if (mode !== 'barcode') return;
    setErrorMsg(null);

    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, barcodeValue, {
        format: barcodeFormat,
        displayValue: true,
        fontSize: 13,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
        height: 50,
      });
      setPreviewDataUrl(canvas.toDataURL('image/png'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid barcode value for chosen format';
      setErrorMsg(message);
      setPreviewDataUrl(null);
    }
  }, [mode, barcodeFormat, barcodeValue]);

  // Generate QR Code Preview
  useEffect(() => {
    if (mode !== 'qrcode') return;
    setErrorMsg(null);

    if (!qrContent.trim()) {
      setPreviewDataUrl(null);
      return;
    }

    QRCode.toDataURL(qrContent, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: qrErrorCorrection,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setPreviewDataUrl(url);
      })
      .catch((err) => {
        setErrorMsg('Failed to generate QR code: ' + err.message);
        setPreviewDataUrl(null);
      });
  }, [mode, qrContent, qrErrorCorrection]);

  const handleAddCode = () => {
    if (!previewDataUrl) return;

    if (mode === 'barcode') {
      const newItem: GraphicItem = {
        id: `bar-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        panelId: effectivePanelId,
        type: 'barcode',
        src: previewDataUrl,
        fileName: `${barcodeFormat}: ${barcodeValue}`,
        barcodeFormat,
        barcodeValue,
        clipToPanel,
      };
      onAddGraphic(newItem);
    } else {
      const newItem: GraphicItem = {
        id: `qr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        panelId: effectivePanelId,
        type: 'qrcode',
        src: previewDataUrl,
        fileName: `QR: ${qrContent.slice(0, 20)}`,
        qrContent,
        clipToPanel,
      };
      onAddGraphic(newItem);
    }
  };

  const setSampleBarcode = (val: string, format: BarcodeFormat) => {
    setBarcodeFormat(format);
    setBarcodeValue(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Target Face Selector */}
      <div style={{
        backgroundColor: 'var(--bg-app)',
        padding: '10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Target Packaging Face:
        </div>
        <select
          value={effectivePanelId}
          onChange={(e) => onSelectPanel(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 8px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {panels.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mode Toggle: Barcode vs QR Code */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button
          type="button"
          onClick={() => setMode('barcode')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '6px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: mode === 'barcode' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            backgroundColor: mode === 'barcode' ? 'var(--accent-primary)' : 'var(--bg-surface)',
            color: mode === 'barcode' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <BarcodeIcon size={14} />
          1D Barcode
        </button>

        <button
          type="button"
          onClick={() => setMode('qrcode')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '6px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: mode === 'qrcode' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            backgroundColor: mode === 'qrcode' ? 'var(--accent-primary)' : 'var(--bg-surface)',
            color: mode === 'qrcode' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <QrCode size={14} />
          2D QR Code
        </button>
      </div>

      {/* Barcode Controls */}
      {mode === 'barcode' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Standard Barcode Symbology:
            </div>
            <select
              value={barcodeFormat}
              onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 8px',
                fontSize: '12px',
              }}
            >
              <option value="EAN13">EAN-13 (International Retail Product Net)</option>
              <option value="UPC">UPC-A (North American 12-Digit Retail)</option>
              <option value="CODE128">Code 128 (Universal Logistics & Lot #)</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Barcode Digits / Code:
            </div>
            <input
              type="text"
              value={barcodeValue}
              onChange={(e) => setBarcodeValue(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 8px',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            />
          </div>

          {/* Quick preset values for testing validity */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setSampleBarcode('5901234123457', 'EAN13')}
              style={{
                fontSize: '10px',
                padding: '3px 6px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              Valid EAN-13
            </button>
            <button
              type="button"
              onClick={() => setSampleBarcode('012345678905', 'UPC')}
              style={{
                fontSize: '10px',
                padding: '3px 6px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              Valid UPC-A
            </button>
            <button
              type="button"
              onClick={() => setSampleBarcode('BATCH-2026-N2', 'CODE128')}
              style={{
                fontSize: '10px',
                padding: '3px 6px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              Batch Code 128
            </button>
          </div>
        </div>
      )}

      {/* QR Code Controls */}
      {mode === 'qrcode' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Target URL or Menu Link:
            </div>
            <input
              type="text"
              value={qrContent}
              onChange={(e) => setQrContent(e.target.value)}
              placeholder="https://yourbrand.com/menu"
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 8px',
                fontSize: '12px',
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Error Correction Level:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setQrErrorCorrection(lvl)}
                  style={{
                    padding: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: qrErrorCorrection === lvl ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: qrErrorCorrection === lvl ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: qrErrorCorrection === lvl ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-medium)',
        minHeight: '80px',
      }}>
        {errorMsg ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--status-danger)',
            fontSize: '11px',
            textAlign: 'center',
          }}>
            <AlertCircle size={14} />
            {errorMsg}
          </div>
        ) : previewDataUrl ? (
          <img
            src={previewDataUrl}
            alt="Code preview"
            style={{
              maxHeight: mode === 'barcode' ? '60px' : '90px',
              maxWidth: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <span style={{ fontSize: '11px', color: '#64748b' }}>Generating preview...</span>
        )}
      </div>

      {/* Auto-Clip Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        backgroundColor: 'var(--bg-app)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        fontSize: '11px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={13} color="var(--accent-secondary)" />
          <span style={{ color: 'var(--text-secondary)' }}>Auto-Clip to Face Polygon</span>
        </div>
        <input
          type="checkbox"
          checked={clipToPanel}
          onChange={(e) => setClipToPanel(e.target.checked)}
          style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
        />
      </div>

      {/* Insert Action */}
      <button
        type="button"
        onClick={handleAddCode}
        disabled={!previewDataUrl || !!errorMsg}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '100%',
          backgroundColor: !previewDataUrl || !!errorMsg ? 'var(--bg-surface)' : 'var(--accent-primary)',
          color: !previewDataUrl || !!errorMsg ? 'var(--text-muted)' : '#ffffff',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '8px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: !previewDataUrl || !!errorMsg ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.15s ease',
        }}
      >
        <Plus size={14} />
        Insert {mode === 'barcode' ? 'Barcode' : 'QR Code'} on Face
      </button>

      <canvas ref={barcodeCanvasRef} style={{ display: 'none' }} />
    </div>
  );
};
