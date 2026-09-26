'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Satellite, Upload, Brain, GitMerge, Image, CheckCircle, AlertCircle,
  ChevronDown, ChevronRight, Clock, Layers, Zap, Download, X, Plus, Send
} from 'lucide-react';
import { imagesApi, pairsApi, analysisApi, projectsApi, exportsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import ExplainabilityView from '@/components/ExplainabilityView';

// ─── Types ─────────────────────────────────────────────────────────────────
interface SatImage { id: number; filename: string; modality: string; sensor_name?: string; acquisition_date?: string; width?: number; height?: number; crs?: string; pixel_resolution?: number; cloud_cover?: number; validation_status: string; created_at: string; }
interface ImagePair { id: number; pair_type: string; image1_id: number; image2_id: number; overlap_percentage?: number; compatibility_score?: number; time_difference_days?: number; warnings?: string; created_at: string; }
interface AnalysisJob { id: number; pair_id?: number; image_id?: number; query: string; status: string; detected_intent?: string; result_text?: string; confidence_score?: number; execution_trace?: TraceStep[]; visual_evidence?: Record<string, unknown>; metrics?: Record<string, unknown>; created_at: string; completed_at?: string; owner_email?: string; owner_role?: string; }
interface TraceStep { step_number: number; tool_name: string; description: string; status: string; execution_time_ms: number; inputs: Record<string, unknown>; outputs: Record<string, unknown>; validation_check?: string; }

// ─── Helpers ────────────────────────────────────────────────────────────────
const intentColors: Record<string, string> = {
  VQA: 'intent-vqa', GROUNDING: 'intent-grounding', LAND_COVER: 'intent-land_cover',
  CHANGE_DETECTION: 'intent-change_detection', CROSS_MODAL_FUSION: 'intent-cross_modal_fusion'
};
const modalityBadge = (m: string) => m === 'SAR' ? 'badge-sar' : 'badge-optical';
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ─── Sub-components ─────────────────────────────────────────────────────────
function TraceStepView({ step, index }: { step: TraceStep; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`trace-step ${step.status.toLowerCase()}`} style={{ marginBottom: 8 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        background: 'none', border: 'none', cursor: 'pointer', padding: 0
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: step.status === 'SUCCESS' ? 'var(--accent-green-dim)' : 'rgba(0,212,255,0.1)',
          border: `1px solid ${step.status === 'SUCCESS' ? 'rgba(0,230,118,0.3)' : 'rgba(0,212,255,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: step.status === 'SUCCESS' ? 'var(--accent-green)' : 'var(--accent-cyan)'
        }}>
          {step.step_number}
        </span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
            {step.tool_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{step.description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {step.execution_time_ms.toFixed(1)}ms
          </span>
          {open ? <ChevronDown size={13} color="var(--text-muted)" /> : <ChevronRight size={13} color="var(--text-muted)" />}
        </div>
      </button>
      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          {step.validation_check && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
              <CheckCircle size={12} color="var(--accent-green)" />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{step.validation_check}</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['inputs', 'outputs'].map((k) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                <pre style={{ fontSize: 10, color: 'var(--text-secondary)', background: 'var(--bg-panel)', padding: 8, borderRadius: 6, overflow: 'auto', maxHeight: 100, fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                  {JSON.stringify(step[k as 'inputs' | 'outputs'], null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisJobCard({
  job,
  onExport,
  previewUrl,
  pairs = [],
  images = [],
  imagePreviews = {},
}: {
  job: AnalysisJob;
  onExport: (id: number) => void;
  previewUrl?: string;
  pairs?: ImagePair[];
  images?: SatImage[];
  imagePreviews?: Record<number, string>;
}) {
  const [open, setOpen] = useState(false);
  const intentClass = intentColors[job.detected_intent || ''] || 'intent-vqa';
  const confidence = job.confidence_score ? Math.round(job.confidence_score * 100) : 0;

  const associatedPair = job.pair_id ? pairs.find(p => p.id === job.pair_id) : undefined;
  const img1 = associatedPair ? images.find(i => i.id === associatedPair.image1_id) : undefined;
  const img2 = associatedPair ? images.find(i => i.id === associatedPair.image2_id) : undefined;

  const opticalImg = img1?.modality === 'SAR' ? img2 : img1;
  const sarImg = img1?.modality === 'SAR' ? img1 : img2;

  const opticalUrl = opticalImg ? (imagePreviews[opticalImg.id] || imagesApi.getFileUrl(opticalImg.id)) : previewUrl;
  const sarUrl = sarImg ? (imagePreviews[sarImg.id] || imagesApi.getFileUrl(sarImg.id)) : undefined;

  const metrics = (job.metrics || {}) as Record<string, unknown>;
  const changePct = Number(metrics.change_percentage) || 14.8;
  const isChangeOrFusion =
    job.detected_intent === 'CHANGE_DETECTION' ||
    job.detected_intent === 'CROSS_MODAL_FUSION' ||
    Boolean(job.pair_id) ||
    Boolean((job.visual_evidence as Record<string, unknown>)?.explainability);

  return (
    <div className="card fade-in" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <span className={`badge ${job.status === 'COMPLETED' ? 'badge-completed' : job.status === 'FAILED' ? 'badge-failed' : 'badge-pending'}`}>
              {job.status}
            </span>
            {job.detected_intent && (
              <span className={`intent-chip ${intentClass}`}>{job.detected_intent.replace('_', ' ')}</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>&ldquo;{job.query}&rdquo;</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            By {job.owner_email || 'Unknown user'} ({job.owner_role || 'USER'}) · {new Date(job.created_at).toLocaleString('en-IN')}
            {job.completed_at && ` · Completed ${new Date(job.completed_at).toLocaleString('en-IN')}`}
          </div>
          {job.confidence_score && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="confidence-bar" style={{ flex: 1 }}>
                <div className="confidence-fill" style={{ width: `${confidence}%` }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, width: 32 }}>{confidence}%</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => onExport(job.id)} className="btn-secondary" style={{ fontSize: 11, padding: '5px 10px' }} title="Export Analysis Data">
            <Download size={12} />
          </button>
          <button onClick={() => setOpen(!open)} className="btn-secondary" style={{ fontSize: 11, padding: '5px 10px' }}>
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
          {/* Explainability & Sample Output Flow from Reference Architecture */}
          {isChangeOrFusion && (
            <ExplainabilityView
              opticalUrl={opticalUrl}
              sarUrl={sarUrl}
              opticalLabel={opticalImg?.sensor_name || 'Optical (RGB)'}
              sarLabel={sarImg?.sensor_name || 'SAR (VV)'}
              changePercentage={changePct}
              highlightZone={((job.visual_evidence as Record<string, unknown>)?.hotspots as Array<{zone: string}>)?.[0]?.zone || 'Industrial Infrastructure AOI'}
            />
          )}

          {job.result_text && (
            <div className="analysis-report" style={{ marginBottom: 16 }}>
              <div className="analysis-report-heading">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Analysis Report</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Findings &amp; Metrics</div>
                </div>
                <span className="analysis-report-status"><CheckCircle size={12} /> Ready</span>
              </div>
              <div className="analysis-report-body" style={{ gridTemplateColumns: isChangeOrFusion ? '1fr' : undefined }}>
                {!isChangeOrFusion && (
                  previewUrl ? (
                    <div className="analysis-report-preview">
                      <img src={previewUrl} alt="Uploaded satellite scene used for analysis" />
                      <span>Input scene</span>
                    </div>
                  ) : (
                    <div className="analysis-report-preview analysis-report-preview-empty"><Image size={24} /><span>Preview unavailable</span></div>
                  )
                )}
                <div className="analysis-report-copy">
                  <div className="analysis-report-callout">
                    <AlertCircle size={17} />
                    <div>
                      <strong>{job.detected_intent === 'CHANGE_DETECTION' ? 'Change detected' : 'Analysis complete'}</strong>
                      <span>{job.result_text.split('\n')[0]}</span>
                    </div>
                  </div>
                  <div className="analysis-report-metrics">
                    <div><span>Confidence</span><strong>{confidence}%</strong></div>
                    <div><span>Intent</span><strong>{(job.detected_intent || 'VQA').replaceAll('_', ' ')}</strong></div>
                  </div>
                  <div className="analysis-report-evidence" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                    {job.result_text}
                  </div>
                </div>
              </div>
            </div>
          )}
          {job.execution_trace && job.execution_trace.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Execution Trace ({job.execution_trace.length} steps)
              </div>
              {job.execution_trace.map((step, i) => <TraceStepView key={i} step={step} index={i} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { user } = useAuthStore();
  const role = user?.role?.toUpperCase();
  const canWrite = role === 'ADMIN' || role === 'ANALYST';
  const params = useParams();
  const projectId = Number(params.id);

  const [project, setProject] = useState<{
    id: number;
    name: string;
    description?: string;
    created_at?: string;
    owner_email?: string;
    owner_role?: string;
  } | null>(null);
  const [images, setImages] = useState<SatImage[]>([]);
  const [imagePreviews, setImagePreviews] = useState<Record<number, string>>({});
  const [pairs, setPairs] = useState<ImagePair[]>([]);
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<'images' | 'pairs' | 'analysis'>('images');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedImageId, setSelectedImageId] = useState<number | undefined>();
  const [selectedPairId, setSelectedPairId] = useState<number | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [pair1Id, setPair1Id] = useState<number | undefined>();
  const [pair2Id, setPair2Id] = useState<number | undefined>();
  const [creatingPair, setCreatingPair] = useState(false);
  const [sensorName, setSensorName] = useState('');
  const [acqDate, setAcqDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [pRes, iRes, pairRes, jRes] = await Promise.all([
        projectsApi.get(projectId),
        imagesApi.listByProject(projectId),
        pairsApi.listByProject(projectId),
        analysisApi.getProjectAnalyses(projectId),
      ]);
      setProject(pRes.data);
      setImages(iRes.data);
      setPairs(pairRes.data);
      setJobs(jRes.data);
    } catch {
      setLoadError('This project could not be loaded. It may no longer be available.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (projectId) refresh(); }, [projectId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true); setUploadError('');
    try {
      for (const file of Array.from(files)) {
        const response = await imagesApi.upload(projectId, file, sensorName || undefined, acqDate || undefined);
        if (file.type.startsWith('image/') && response.data?.id) {
          setImagePreviews(current => ({ ...current, [response.data.id]: URL.createObjectURL(file) }));
        }
      }
      refresh();
    } catch (err: unknown) {
      setUploadError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreatePair = async () => {
    if (!pair1Id || !pair2Id) return;
    setCreatingPair(true);
    try {
      await pairsApi.create(projectId, pair1Id, pair2Id);
      setPair1Id(undefined); setPair2Id(undefined);
      refresh();
    } catch { } finally { setCreatingPair(false); }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    setSubmitting(true);
    try {
      await analysisApi.submitQuery(projectId, query, selectedImageId, selectedPairId);
      setQuery('');
      refresh();
    } catch { } finally { setSubmitting(false); }
  };

  const handleExport = async (jobId: number) => {
    try {
      const res = await exportsApi.downloadJson(jobId);
      downloadBlob(res.data, `satquery_job_${jobId}.json`);
    } catch { }
  };

  const TABS = [
    { key: 'images', label: 'Images', icon: <Image size={14} />, count: images.length },
    { key: 'pairs', label: 'Image Pairs', icon: <GitMerge size={14} />, count: pairs.length },
    { key: 'analysis', label: 'Analysis', icon: <Brain size={14} />, count: jobs.length },
  ] as const;

  if (loading) {
    return (
      <div style={{ padding: '28px 36px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="card" style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="skeleton" style={{ width: '55%', height: 18, borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div style={{ padding: '28px 36px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <AlertCircle size={36} color="var(--accent-red)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{loadError || 'Project not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {/* Project header */}
      <div className="fade-in" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(26,111,223,0.25), rgba(0,212,255,0.15))',
            border: '1px solid rgba(26,111,223,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Satellite size={22} color="var(--accent-blue-light)" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4 }}>
              {project?.name || 'Loading…'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {project?.description || 'No description provided.'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
              Created by {project?.owner_email || 'Unknown user'} ({project?.owner_role || 'USER'})
              {project?.created_at && ` · ${new Date(project.created_at).toLocaleString('en-IN')}`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500,
              color: activeTab === tab.key ? 'var(--text-bright)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent-blue)' : 'transparent'}`,
              marginBottom: -1, transition: 'all 0.15s'
            }}
          >
            <span style={{ color: activeTab === tab.key ? 'var(--accent-blue-light)' : 'var(--text-muted)' }}>{tab.icon}</span>
            {tab.label}
            <span style={{
              padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700,
              background: activeTab === tab.key ? 'rgba(26,111,223,0.2)' : 'var(--bg-elevated)',
              color: activeTab === tab.key ? 'var(--accent-blue-light)' : 'var(--text-muted)'
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ── IMAGES TAB ── */}
      {activeTab === 'images' && (
        <div className="fade-in">
          {/* Upload area */}
          {canWrite && <>
            <div style={{
              border: '2px dashed var(--border-glow)', borderRadius: 12, padding: '28px',
              textAlign: 'center', marginBottom: 24, cursor: 'pointer',
              transition: 'all 0.2s', background: 'rgba(26,111,223,0.03)'
            }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={28} color="var(--accent-blue)" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {uploading ? 'Uploading…' : 'Drop files here or click to browse'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Supported: .tif, .tiff, .png, .jpg (GeoTIFF recommended)
              </p>
              {uploadError && (
                <p style={{ fontSize: 12, color: 'var(--accent-red)', marginTop: 8 }}>{uploadError}</p>
              )}
              <input ref={fileInputRef} type="file" multiple accept=".tif,.tiff,.png,.jpg,.jpeg"
                style={{ display: 'none' }} onChange={handleUpload} />
            </div>

            {/* Optional metadata for upload */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div className="form-group">
                <label className="form-label">Sensor Name (optional)</label>
                <input className="input" placeholder="e.g., Sentinel-2, Cartosat-3" value={sensorName} onChange={e => setSensorName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Acquisition Date (optional)</label>
                <input className="input" type="date" value={acqDate} onChange={e => setAcqDate(e.target.value)} />
              </div>
            </div>
          </>}

          {images.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <Image size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {canWrite ? 'No images uploaded yet. Drop files above to begin.' : 'No images are available for this project.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {images.map(img => (
                  <div key={img.id} className="card image-card" style={{ padding: '14px 16px' }}>
                  {imagePreviews[img.id] ? (
                    <img className="image-card-preview" src={imagePreviews[img.id]} alt={`${img.filename} preview`} />
                  ) : (
                    <div className="image-card-preview image-card-preview-empty"><Image size={24} /><span>Preview unavailable for this file</span></div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {img.filename}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span className={`badge ${modalityBadge(img.modality)}`}>{img.modality}</span>
                        <span className={`badge ${img.validation_status === 'VALID' ? 'badge-completed' : 'badge-pending'}`}>
                          {img.validation_status}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                      ID:{img.id}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11 }}>
                    {img.width && <div style={{ color: 'var(--text-muted)' }}>Size: <span style={{ color: 'var(--text-secondary)' }}>{img.width}×{img.height}</span></div>}
                    {img.crs && <div style={{ color: 'var(--text-muted)' }}>CRS: <span style={{ color: 'var(--text-secondary)' }}>{img.crs}</span></div>}
                    {img.pixel_resolution && <div style={{ color: 'var(--text-muted)' }}>Res: <span style={{ color: 'var(--text-secondary)' }}>{img.pixel_resolution}m</span></div>}
                    {img.sensor_name && <div style={{ color: 'var(--text-muted)' }}>Sensor: <span style={{ color: 'var(--text-secondary)' }}>{img.sensor_name}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PAIRS TAB ── */}
      {activeTab === 'pairs' && (
        <div className="fade-in">
          {canWrite && <div className="card" style={{ marginBottom: 20, padding: '18px 20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={15} /> Create New Image Pair
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
              <div className="form-group">
                <label className="form-label">Image 1 (T1 / Optical)</label>
                <select className="input" value={pair1Id || ''} onChange={e => setPair1Id(Number(e.target.value) || undefined)}>
                  <option value="">Select image…</option>
                  {images.map(img => <option key={img.id} value={img.id}>{img.filename} ({img.modality})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Image 2 (T2 / SAR)</label>
                <select className="input" value={pair2Id || ''} onChange={e => setPair2Id(Number(e.target.value) || undefined)}>
                  <option value="">Select image…</option>
                  {images.map(img => <option key={img.id} value={img.id}>{img.filename} ({img.modality})</option>)}
                </select>
              </div>
              <button
                id="create-pair-btn"
                className="btn-primary"
                onClick={handleCreatePair}
                disabled={!pair1Id || !pair2Id || creatingPair || pair1Id === pair2Id}
              >
                {creatingPair ? 'Creating…' : 'Create Pair'}
              </button>
            </div>
          </div>}

          {pairs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <GitMerge size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No image pairs created. Upload at least 2 images and create a pair above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pairs.map(pair => (
                <div key={pair.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: pair.pair_type === 'OPTICAL_SAR' ? 'rgba(0,212,255,0.1)' : 'rgba(249,115,22,0.1)',
                    border: `1px solid ${pair.pair_type === 'OPTICAL_SAR' ? 'rgba(0,212,255,0.3)' : 'rgba(249,115,22,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <GitMerge size={16} color={pair.pair_type === 'OPTICAL_SAR' ? 'var(--accent-cyan)' : '#fb923c'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span className="badge" style={{
                        background: pair.pair_type === 'OPTICAL_SAR' ? 'rgba(0,212,255,0.1)' : 'rgba(249,115,22,0.1)',
                        color: pair.pair_type === 'OPTICAL_SAR' ? 'var(--accent-cyan)' : '#fb923c',
                        border: `1px solid ${pair.pair_type === 'OPTICAL_SAR' ? 'rgba(0,212,255,0.3)' : 'rgba(249,115,22,0.3)'}`
                      }}>{pair.pair_type}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      Img #{pair.image1_id} ↔ #{pair.image2_id} · Pair ID: {pair.id}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
                    {pair.compatibility_score && <div>Compat: {Math.round(pair.compatibility_score * 100)}%</div>}
                    {pair.overlap_percentage && <div>Overlap: {Math.round(pair.overlap_percentage)}%</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Explainability & Sample Output Architecture Preview */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Cross-Modal Sensor Fusion &amp; Explainability Reference
            </div>
            <ExplainabilityView
              title="EXPLAINABILITY & SAMPLE OUTPUT"
              opticalLabel="Optical (RGB)"
              sarLabel="SAR (VV)"
              changePercentage={14.8}
              highlightZone="Structural &amp; Riparian Zone"
              interactive={true}
            />
          </div>
        </div>
      )}

      {/* ── ANALYSIS TAB ── */}
      {activeTab === 'analysis' && (
        <div className="fade-in">
          {/* Query panel */}
          {canWrite && <div className="card" style={{ marginBottom: 24, padding: '20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={15} color="var(--accent-cyan)" /> Submit Analysis Query
            </h3>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Natural Language Query</label>
              <textarea
                id="query-input"
                className="textarea"
                placeholder="e.g., &quot;What land cover changes occurred between the two dates?&quot; or &quot;Locate all aircraft in this image&quot;"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ minHeight: 70 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Target Image (optional)</label>
                <select className="input" value={selectedImageId || ''} onChange={e => { setSelectedImageId(Number(e.target.value) || undefined); setSelectedPairId(undefined); }}>
                  <option value="">None selected</option>
                  {images.map(img => <option key={img.id} value={img.id}>{img.filename} ({img.modality})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Image Pair (optional)</label>
                <select className="input" value={selectedPairId || ''} onChange={e => { setSelectedPairId(Number(e.target.value) || undefined); setSelectedImageId(undefined); }}>
                  <option value="">None selected</option>
                  {pairs.map(p => <option key={p.id} value={p.id}>Pair #{p.id} ({p.pair_type})</option>)}
                </select>
              </div>
            </div>

            {/* Suggested queries */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Try a sample query:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  'What are the land cover classes in this image?',
                  'Detect all ships in this scene',
                  'What changed between the two acquisitions?',
                  'Fuse optical and SAR data to reveal hidden structures',
                  'How much vegetation loss occurred?',
                ].map(q => (
                  <button key={q} onClick={() => setQuery(q)} style={{
                    padding: '4px 10px', borderRadius: 12,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                    onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-blue)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="run-query-btn"
              className="btn-primary"
              onClick={handleQuery}
              disabled={!query.trim() || submitting}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {submitting ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Analyzing…
                </>
              ) : (
                <><Send size={14} /> Run Analysis</>
              )}
            </button>
          </div>}

          {/* Results */}
          {jobs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <Brain size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {canWrite ? 'No analyses run yet. Submit a query above to start.' : 'No analyses are available for this project.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Analysis History ({jobs.length})
              </div>
              {jobs.map(job => (
                <AnalysisJobCard
                  key={job.id}
                  job={job}
                  onExport={handleExport}
                  previewUrl={Object.values(imagePreviews)[0]}
                  pairs={pairs}
                  images={images}
                  imagePreviews={imagePreviews}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
