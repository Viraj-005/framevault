import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { CollectionOptions, CollectionSummary, ImageCandidate, ImageFormat, Platform, ScanResponse } from '../core/types';
import { csvEscape, formatCount, isSafeImageUrl, safeFilename, sha256, slugify } from '../core/utils';
import { decodeImage, type ImagePayload } from '../core/image-transfer';
import { writeFile } from '../core/file-writer';

const initialOptions: CollectionOptions = { exportJson: true, exportCsv: true, removeDuplicates: false, maxImages: 100, imageFormat: 'original' };

function Icon({ name }: { name: 'folder' | 'scan' | 'check' | 'arrow' | 'shield' | 'download' | 'info' | 'minus' | 'plus' }) {
  const paths = {
    folder: <><path d="M3.5 6.5h5l1.8 2h10.2v9.5H3.5z" /><path d="M3.5 6.5V5h6l1.8 2" /></>,
    scan: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5M11 7.5v7M7.5 11h7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
    shield: <><path d="M12 3 19 6v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
    download: <><path d="M12 4v10m-4-4 4 4 4-4" /><path d="M5 20h14" /></>,
    info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 10.5v5" /><path d="M12 7.7h.01" /></>,
    minus: <path d="M6 12h12" />,
    plus: <><path d="M12 6v12" /><path d="M6 12h12" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

type SourceMark = 'behance' | 'dribbble' | 'awwwards' | 'pinterest';

const sourceRail: Array<{ name: string; mark: SourceMark; state: 'active' | 'next' }> = [
  { name: 'Behance', mark: 'behance', state: 'active' },
  { name: 'Dribbble', mark: 'dribbble', state: 'active' },
  { name: 'Awwwards', mark: 'awwwards', state: 'next' },
  { name: 'Pinterest', mark: 'pinterest', state: 'next' },
];

function SourceGlyph({ mark }: { mark: SourceMark }) {
  const glyphs = {
    behance: <path d="M16.969 16.927a2.561 2.561 0 0 0 1.901.677 2.501 2.501 0 0 0 1.531-.475c.362-.235.636-.584.779-.99h2.585a5.091 5.091 0 0 1-1.9 2.896 5.292 5.292 0 0 1-3.091.88 5.839 5.839 0 0 1-2.284-.433 4.871 4.871 0 0 1-1.723-1.211 5.657 5.657 0 0 1-1.08-1.874 7.057 7.057 0 0 1-.383-2.393c-.005-.8.129-1.595.396-2.349a5.313 5.313 0 0 1 5.088-3.604 4.87 4.87 0 0 1 2.376.563c.661.362 1.231.87 1.668 1.485a6.2 6.2 0 0 1 .943 2.133c.194.821.263 1.666.205 2.508h-7.699c-.063.79.184 1.574.688 2.187ZM6.947 4.084a8.065 8.065 0 0 1 1.928.198 4.29 4.29 0 0 1 1.49.638c.418.303.748.711.958 1.182.241.579.357 1.203.341 1.83a3.506 3.506 0 0 1-.506 1.961 3.726 3.726 0 0 1-1.503 1.287 3.588 3.588 0 0 1 2.027 1.437c.464.747.697 1.615.67 2.494a4.593 4.593 0 0 1-.423 2.032 3.945 3.945 0 0 1-1.163 1.413 5.114 5.114 0 0 1-1.683.807 7.135 7.135 0 0 1-1.928.259H0V4.084h6.947Zm-.235 12.9c.308.004.616-.029.916-.099a2.18 2.18 0 0 0 .766-.332c.228-.158.411-.371.534-.619.142-.317.208-.663.191-1.009a2.08 2.08 0 0 0-.642-1.715 2.618 2.618 0 0 0-1.696-.505h-3.54v4.279h3.471Zm13.635-5.967a2.13 2.13 0 0 0-1.654-.619 2.336 2.336 0 0 0-1.163.259 2.474 2.474 0 0 0-.738.62 2.359 2.359 0 0 0-.396.792c-.074.239-.12.485-.137.734h4.769a3.239 3.239 0 0 0-.679-1.785l-.002-.001Zm-13.813-.648a2.254 2.254 0 0 0 1.423-.433c.399-.355.607-.88.56-1.413a1.916 1.916 0 0 0-.178-.891 1.298 1.298 0 0 0-.495-.533 1.851 1.851 0 0 0-.711-.274 3.966 3.966 0 0 0-.835-.073H3.241v3.631h3.293v-.014ZM21.62 5.122h-5.976v1.527h5.976V5.122Z" />,
    dribbble: <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z" />,
    awwwards: <path d="m14.72 5.6-2.24 8.68-2.12-8.68H7.47l-2.12 8.68L3.11 5.6H0l4.01 12.65h2.74l2.17-8.18 2.16 8.18h2.74L17.83 5.6zm5.1 10.7c0 1.2.9 2.1 2.09 2.1 1.2 0 2.09-.9 2.09-2.1s-.9-2.12-2.1-2.12c-1.19 0-2.08.9-2.08 2.11" />,
    pinterest: <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="source-glyph" fill="currentColor">{glyphs[mark]}</svg>;
}

function SourceRail() {
  const items = [...sourceRail, ...sourceRail];
  return <section className="source-rail" aria-label="Supported and planned source adapters">
    <div className="source-rail-heading"><span className="source-rail-kicker"><span className="source-rail-dot" /> SOURCE ADAPTERS</span><span className="source-rail-note">2 active / 2 in review</span></div>
    <div className="source-marquee" tabIndex={0}>
      <div className="source-marquee-track">
        {items.map((source, index) => <div className={`source-chip source-chip-${source.state} source-chip-${source.mark}`} key={`${source.mark}-${index}`}>
          <span className="source-chip-icon"><SourceGlyph mark={source.mark} /></span>
          <span>{source.name}</span>
          <span className="source-chip-state">{source.state === 'active' ? 'ready' : 'next'}</span>
        </div>)}
      </div>
    </div>
  </section>;
}

export default function App() {
  const [candidates, setCandidates] = useState<ImageCandidate[]>([]);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null);
  const [folderLabel, setFolderLabel] = useState('Choose a destination');
  const [options, setOptions] = useState<CollectionOptions>(initialOptions);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'collecting' | 'complete'>('idle');
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [message, setMessage] = useState('Open a Behance or Dribbble page, then click Scan current page to find frames.');
  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [activeInfo, setActiveInfo] = useState<'selection-cap' | 'duplicate-check' | null>(null);
  const [invalidCandidateIds, setInvalidCandidateIds] = useState<string[]>([]);

  useEffect(() => {
    void restoreFolderHandle().then((handle) => {
      if (handle) {
        setFolder(handle);
        setFolderLabel(handle.name);
      }
    });
  }, []);

  const selectedCount = candidates.filter((candidate) => candidate.selected).length;
  const querySlug = slugify(query);
  const destination = folder ? `${folderLabel} / ${platform} / ${querySlug}` : 'No folder selected';

  const stats = useMemo(() => [
    { label: 'Candidates', value: formatCount(candidates.length) },
    { label: 'Selected', value: formatCount(selectedCount) },
    { label: 'Metadata', value: options.exportJson && options.exportCsv ? 'JSON + CSV' : options.exportJson ? 'JSON' : options.exportCsv ? 'CSV' : 'Off' },
  ], [candidates.length, options.exportCsv, options.exportJson, selectedCount]);

  function toggleCandidate(candidateId: string) {
    setInvalidCandidateIds((current) => current.filter((id) => id !== candidateId));
    setCandidates((current) => current.map((candidate) => candidate.candidateId === candidateId ? { ...candidate, selected: !candidate.selected } : candidate));
  }

  function selectVisible(value: boolean) {
    setInvalidCandidateIds([]);
    setCandidates((current) => current.map((candidate) => ({ ...candidate, selected: value })));
  }

  function removeInvalidFromSelection() {
    setCandidates((current) => current.map((candidate) => invalidCandidateIds.includes(candidate.candidateId) ? { ...candidate, selected: false } : candidate));
    setInvalidCandidateIds([]);
    setMessage('Flagged frames were removed from the selection.');
  }

  async function scanCurrentPage() {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      setMessage('Scanning works in the installed Chrome extension. Load the dist folder in chrome://extensions, then open FrameVault on Behance or Dribbble.');
      return;
    }
    setStatus('scanning');
    setMessage('Reading visible image candidates from the active page.');
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.id) throw new Error('No active tab was found.');
      if (tab.url) {
        const permissionOrigin = supportedOriginForUrl(tab.url);
        if (!permissionOrigin) throw new Error('This site is not supported by FrameVault.');
        const granted = await chrome.permissions.request({ origins: [permissionOrigin] });
        if (!granted) throw new Error('Site permission was not granted.');
      }
      let response: ScanResponse | undefined;
      try {
        response = await chrome.tabs.sendMessage(tab.id, { type: 'scan-page' }) as ScanResponse;
        if (!response) throw new Error('The page reader did not respond.');
      } catch {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
        response = await chrome.tabs.sendMessage(tab.id, { type: 'scan-page' }) as ScanResponse;
      }
      if (!response?.candidates?.length) throw new Error('No supported visible candidates were found.');
      setCandidates(response.candidates);
      setInvalidCandidateIds([]);
      setPlatform(response.platform);
      setQuery(response.queryText || 'untitled-query');
      setMessage(`${response.candidates.length} visible candidates found on ${response.platform}.`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown scan error.';
      setMessage(`Scan stopped. ${reason}`);
    } finally {
      setStatus('idle');
    }
  }

  async function chooseFolder() {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setFolder(handle);
      setFolderLabel(handle.name);
      await persistFolderHandle(handle);
      setMessage('Folder approved. Collection will write only inside the selected destination.');
    } catch {
      setMessage('Folder selection was cancelled. Choose a destination before collecting.');
    }
  }

  async function collect(onlyCandidateIds?: string[]) {
    if (status === 'collecting') return;
    if (!selectedCount) return setMessage('Select at least one frame before collecting.');
    if (!folder) return setMessage('Choose a destination folder before collecting.');
    setStatus('collecting');
    setSummary(null);
    try {
      const selected = candidates.filter((candidate) => onlyCandidateIds ? onlyCandidateIds.includes(candidate.candidateId) : candidate.selected).slice(0, options.maxImages);
      setProgress({ processed: 0, total: selected.length });
      await ensureDirectoryPermission(folder);
      const target = await folder.getDirectoryHandle(platform, { create: true });
      const queryDirectory = await target.getDirectoryHandle(querySlug, { create: true });
      const records: Array<Record<string, unknown>> = [];
      let saved = 0;
      let duplicates = 0;
      let failed = 0;
      let firstFailure = '';
      const failures: CollectionSummary['failures'] = [];
      const seen = new Set<string>();
      const invalidIds = selected.filter((candidate) => !imagePermissionOrigin(candidate.imageUrl)).map((candidate) => candidate.candidateId);
      if (invalidIds.length) {
        setInvalidCandidateIds(invalidIds);
        setMessage(`${invalidIds.length} selected frame${invalidIds.length === 1 ? ' is' : 's are'} outside the approved image policy. Review the highlighted frames.`);
        setStatus('idle');
        return;
      }
      const imageOrigins = Array.from(new Set(selected.map((candidate) => imagePermissionOrigin(candidate.imageUrl)).filter((origin): origin is string => Boolean(origin))));
      const imagePermission = await chrome.permissions.request({ origins: imageOrigins });
      if (!imagePermission) {
        setMessage('Allow the image-host permission before collecting frames.');
        setStatus('idle');
        return;
      }
      const processCandidate = async (candidate: ImageCandidate) => {
      try {
        if (!isSafeImageUrl(candidate.imageUrl)) throw new Error('Image URL is outside the safe HTTPS policy.');
        const imageResponse = await chrome.runtime.sendMessage({ type: 'fetch-image', imageUrl: candidate.imageUrl }) as ImagePayload & { ok: boolean; error?: string };
        if (!imageResponse?.ok) throw new Error(imageResponse?.error || 'The image request failed.');
        const sourceBlob = decodeImage(imageResponse);
        const converted = await convertImageFormat(sourceBlob, options.imageFormat);
        const { blob, mimeType } = converted;
        const hash = await sha256(blob);
        if (options.removeDuplicates && seen.has(hash)) {
          duplicates += 1;
          records.push({ candidateId: candidate.candidateId, sourceImageUrl: candidate.imageUrl, status: 'duplicate', sha256: hash });
          return;
        }
        const filename = safeFilename(candidate.position, candidate.imageUrl, mimeType);
        await writeFile(queryDirectory, filename, blob);
        seen.add(hash);
        saved += 1;
        records.push({ candidateId: candidate.candidateId, sourceImageUrl: candidate.imageUrl, localRelativePath: `${platform}/${querySlug}/${filename}`, filename, mimeType, byteSize: blob.size, status: 'saved', sha256: hash });
      } catch (error) {
        failed += 1;
        const failureMessage = collectionErrorMessage(error);
        failures.push({ candidateId: candidate.candidateId, position: candidate.position, reason: failureMessage });
        if (!firstFailure) firstFailure = failureMessage;
        records.push({ candidateId: candidate.candidateId, sourceImageUrl: candidate.imageUrl, status: 'failed', failureMessage });
      } finally {
        setProgress((current) => ({ ...current, processed: Math.min(current.processed + 1, current.total) }));
      }
      };
      const batchSize = 4;
      for (let index = 0; index < selected.length; index += batchSize) {
        const batch = selected.slice(index, index + batchSize);
        setMessage(`Downloading frames ${index + 1}-${index + batch.length} of ${selected.length}...`);
        for (const candidate of batch) await processCandidate(candidate);
        setMessage(`${Math.min(index + batch.length, selected.length)} of ${selected.length} frames processed. ${saved} saved so far.`);
      }
      const runId = crypto.randomUUID();
      const exportPayload = { schemaVersion: '1.0.0', runId, platform, query, querySlug, collectedAt: new Date().toISOString(), options, assets: records };
      if (options.exportJson) await writeText(queryDirectory, `metadata-${runId}.json`, JSON.stringify(exportPayload, null, 2));
      if (options.exportCsv) await writeText(queryDirectory, `metadata-${runId}.csv`, buildCsv(records));
      setSummary({ saved, duplicates, failed, failures, skipped: onlyCandidateIds ? 0 : Math.max(0, candidates.filter((item) => item.selected).length - selected.length), folderLabel, relativePath: `${platform}/${querySlug}` });
      setMessage(failed ? `Collection finished with ${failed} error${failed === 1 ? '' : 's'}. ${firstFailure}` : 'Collection complete. Your selected frames are in the approved folder.');
      setStatus('complete');
    } catch (error) {
      const rawReason = error instanceof Error ? error.message : 'Unknown collection error.';
      const folderProblem = rawReason.includes('getDirectoryHandle') || rawReason.includes('FileSystemDirectoryHandle');
      const reason = folderProblem ? 'Chrome no longer allows access to the saved destination folder. Choose the folder again before collecting.' : rawReason;
      setSummary(null);
      if (folderProblem || reason.includes('destination folder permission') || reason.includes('Destination folder permission')) {
        setFolder(null);
        setFolderLabel('Choose a destination');
      }
      setMessage(`Collection stopped before completion. ${reason}`);
      setStatus('idle');
    }
  }

  const progressPercent = progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;

  return <main className="shell" aria-busy={status === 'collecting'}>
    <div className="depth-field" aria-hidden="true"><div className="depth-tile depth-tile-one" /><div className="depth-tile depth-tile-two" /><div className="depth-tile depth-tile-three" /><div className="depth-tile depth-tile-four" /><div className="depth-tile depth-tile-five" /></div>
    <header className="topbar">
      <div className="brand-lockup"><div className="brand-mark"><span /></div><div><div className="brand-name">FrameVault</div><div className="brand-kicker">UI reference collector</div></div></div>
      <div className="connection"><span className="live-dot" /> local only</div>
    </header>

    <section className="intro">
      <div className="eyebrow"><span className="eyebrow-marker" aria-hidden="true"><span /></span> CURRENT PAGE</div>
      <h1>Collect the frames<br /><em>worth keeping.</em></h1>
      <p className="intro-copy">Select visible UI references from the page you are studying. FrameVault saves the files and their trail to a folder you approve.</p>
      <div className="toolbar"><button className="button button-primary" onClick={scanCurrentPage} disabled={status === 'scanning'}><Icon name="scan" /> {status === 'scanning' ? 'Scanning page' : 'Scan current page'}</button><span className="toolbar-note"><Icon name="shield" /> No upload. No hidden crawl.</span></div>
      <SourceRail />
      <div className="vault-stage" aria-label="FrameVault collection preview">
        <div className="stage-grid" />
        <div className="stage-orbit orbit-one" />
        <div className="stage-orbit orbit-two" />
        <div className="frame-card frame-back"><div className="card-topline"><span>03</span><span>DRB</span></div><div className="card-art art-blue" /><div className="card-footer"><span>dashboard</span><span>4:5</span></div></div>
        <div className="frame-card frame-middle"><div className="card-topline"><span>02</span><span>BHC</span></div><div className="card-art art-red" /><div className="card-footer"><span>commerce</span><span>4:5</span></div></div>
        <div className="frame-card frame-front"><div className="card-topline"><span>01</span><span>LIVE</span></div><div className="card-art art-gold"><div className="art-window"><span /><span /><span /></div><div className="art-lines"><i /><i /><i /></div></div><div className="card-footer"><span>banking</span><span>4:5</span></div></div>
        <div className="stage-label stage-label-top"><span className="stage-pulse" /> SELECTED FRAMES</div>
        <div className="stage-label stage-label-bottom"><button type="button" className={`info-wrap stage-info ${activeInfo === 'duplicate-check' ? 'is-open' : ''}`} onClick={() => setActiveInfo(activeInfo === 'duplicate-check' ? null : 'duplicate-check')} aria-label="Local duplicate check information"><Icon name="info" /><span className="info-tooltip" role="tooltip">FrameVault creates a local SHA-256 fingerprint for each image to identify duplicates. Nothing is uploaded.</span></button> LOCAL DUPLICATE CHECK</div>
      </div>
    </section>

    <section className="context-row" aria-label="Collection context">
      <div className="context-item"><span className="context-label">SOURCE</span><strong>{platform === 'behance' ? 'Behance' : platform === 'dribbble' ? 'Dribbble' : 'Unknown site'}</strong><span className="context-muted">visible result grid</span></div>
      <div className="context-item"><span className="context-label">QUERY</span><label className="sr-only" htmlFor="query">Query</label><input id="query" value={query} onChange={(event) => setQuery(event.target.value)} /><span className="context-muted">folder: {querySlug}</span></div>
      <div className="context-item context-item-end"><span className="context-label">DESTINATION</span><button className="folder-button" onClick={chooseFolder}><Icon name="folder" /><span>{folderLabel}</span><Icon name="arrow" /></button><span className="context-muted">{destination}</span></div>
    </section>

    <section className="workbench">
      <div className="workbench-header"><div><div className="section-eyebrow">VISIBLE CANDIDATES</div><h2>Choose what enters the vault</h2></div><div className="selection-actions">{invalidCandidateIds.length > 0 && <button className="text-button invalid-action" onClick={removeInvalidFromSelection}>Remove flagged</button>}<button className="text-button" onClick={() => selectVisible(true)}>Select visible</button><button className="text-button muted-action" onClick={() => selectVisible(false)}>Clear</button></div></div>
      <div className="stats-row">{stats.map((stat) => <div className="stat" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}</div>
      <div className="candidate-grid">{candidates.map((candidate, index) => <article className={`candidate ${candidate.selected ? 'is-selected' : ''} ${invalidCandidateIds.includes(candidate.candidateId) ? 'is-invalid' : ''}`} key={candidate.candidateId} style={{ '--delay': `${index * 70}ms` } as CSSProperties}>
        <button className="candidate-image" onClick={() => toggleCandidate(candidate.candidateId)} aria-label={`${candidate.selected ? 'Deselect' : 'Select'} ${candidate.altText || 'candidate frame'}`}><img src={candidate.previewUrl || candidate.imageUrl} alt={candidate.altText || 'UI design candidate'} /><span className="selection-mark"><Icon name="check" /></span><span className="frame-index">{String(candidate.position).padStart(2, '0')}</span>{invalidCandidateIds.includes(candidate.candidateId) && <span className="policy-flag">OUTSIDE SOURCE</span>}</button>
        <div className="candidate-meta"><div><strong>{candidate.altText || 'Untitled frame'}</strong><span>{candidate.authorName || 'Author not shown'}</span></div><span className="candidate-status">{candidate.selected ? 'selected' : 'available'}</span></div>
      </article>)}</div>
      {!candidates.length && <div className="empty-state"><span className="empty-symbol"><Icon name="scan" /></span><h3>No visible frames yet</h3><p>Scan a supported Behance or Dribbble page to populate this space.</p></div>}
    </section>

    <section className="bottom-grid">
      <div className="destination-panel"><div className="section-eyebrow">SAVE RULES</div><h2>Organized at the point of capture.</h2><p>Each run creates a platform and query folder. The original page, image URL, hash, and result status travel with every saved frame.</p><div className="path-preview"><span className="path-root">{folderLabel}</span><Icon name="arrow" /><span>{platform}</span><Icon name="arrow" /><span className="path-accent">{querySlug}</span></div></div>
      <div className="options-panel"><div className="option-row"><div><strong>Metadata exports</strong><span>Write JSON and CSV alongside the images</span></div><div className="toggles"><label><input type="checkbox" checked={options.exportJson} onChange={(event) => setOptions((current) => ({ ...current, exportJson: event.target.checked }))} /><span>JSON</span></label><label><input type="checkbox" checked={options.exportCsv} onChange={(event) => setOptions((current) => ({ ...current, exportCsv: event.target.checked }))} /><span>CSV</span></label></div></div><div className="option-row"><div><strong>Image format</strong><span>Choose the file type written to disk</span></div><select className="format-select" aria-label="Image format" value={options.imageFormat} onChange={(event) => setOptions((current) => ({ ...current, imageFormat: event.target.value as ImageFormat }))}><option value="original">Original</option><option value="png">PNG</option><option value="jpg">JPG</option></select></div><div className="option-row"><div><strong>Duplicate removal</strong><span>{options.removeDuplicates ? 'Skip matching SHA-256 content' : 'Save every selected source'}</span></div><label className="switch-control"><input type="checkbox" aria-label="Enable duplicate removal" checked={options.removeDuplicates} onChange={(event) => setOptions((current) => ({ ...current, removeDuplicates: event.target.checked }))} /><span className="switch-track"><span /></span><em>{options.removeDuplicates ? 'enabled' : 'off'}</em></label></div><div className="option-row"><div><strong>Selection cap <button type="button" className={`info-wrap ${activeInfo === 'selection-cap' ? 'is-open' : ''}`} onClick={() => setActiveInfo(activeInfo === 'selection-cap' ? null : 'selection-cap')} aria-label="Selection cap information"><Icon name="info" /><span className="info-tooltip" role="tooltip">The maximum number of selected frames FrameVault will process in one collection run.</span></button></strong><span>Bounded collection per run</span></div><div className="cap-field"><div className="stepper-control"><button type="button" className="stepper-button" aria-label="Decrease selection cap" onClick={() => setOptions((current) => ({ ...current, maxImages: Math.max(1, current.maxImages - 1) }))}><Icon name="minus" /></button><input aria-label="Selection cap value" type="number" min="1" max="100" value={options.maxImages} onChange={(event) => setOptions((current) => ({ ...current, maxImages: Math.min(100, Math.max(1, Number(event.target.value) || 1)) }))} /><button type="button" className="stepper-button" aria-label="Increase selection cap" onClick={() => setOptions((current) => ({ ...current, maxImages: Math.min(100, current.maxImages + 1) }))}><Icon name="plus" /></button></div><span className="cap-unit">frames</span></div></div></div>
    </section>

<footer className="action-bar"><div><span className="action-label">READY TO COLLECT</span><strong>{selectedCount} selected <span className="separator">/</span> {destination}</strong></div><button className="button button-accent" onClick={() => void collect()} disabled={status === 'collecting'}>{status === 'collecting' ? 'Saving frames' : 'Collect selected'}<Icon name="arrow" /></button></footer>
    <div className="status-line" role="status">{message}</div>
    {summary && <section className={`completion ${summary.failed ? 'completion-error' : ''}`} aria-live="polite">
      <div className="completion-check"><Icon name={summary.failed ? 'info' : 'check'} /></div>
      <div className="completion-body">
        <h2>{summary.failed ? 'Collection needs attention' : 'Collection complete'}</h2>
        <p className="completion-count">{summary.saved} frame{summary.saved === 1 ? '' : 's'} saved</p>
        <p className="completion-path" title={`${summary.folderLabel}/${summary.relativePath}`}><Icon name="folder" /> {summary.folderLabel}/{summary.relativePath}</p>
        <div className="completion-stats"><span>{summary.duplicates} duplicates skipped</span><span>{summary.failed} failed</span>{summary.skipped > 0 && <span>{summary.skipped} above selection cap</span>}</div>
        {summary.failed > 0 && <details className="failure-details"><summary>Review failed frames ({summary.failed})</summary><ul>{summary.failures.map((failure) => <li key={failure.candidateId}><strong>Frame {failure.position}</strong><span>{failure.reason}</span></li>)}</ul></details>}
        {summary.failed > 0 && <button type="button" className="button retry-button" onClick={() => void collect(summary.failures.map((failure) => failure.candidateId))}>Retry {summary.failed} failed frame{summary.failed === 1 ? '' : 's'}<Icon name="arrow" /></button>}
        <details className="folder-help"><summary>Find saved files</summary><p>Open your chosen folder, {summary.folderLabel}, in File Explorer. Then open {summary.relativePath}. Metadata files for each run are stored alongside the images when exports are enabled.</p></details>
      </div>
    </section>}
    {status === 'collecting' && <div className="collection-lock" role="status" aria-live="polite"><div className="collection-lock-panel"><div className="collection-lock-kicker"><span className="collection-lock-pulse" /> COLLECTION IN PROGRESS</div><h2>Saving your selected frames.</h2><p>Controls are locked until the images and metadata finish writing.</p><div className="progress-meta"><span>{progress.processed} of {progress.total} frames processed</span><strong>{progressPercent}%</strong></div><div className="progress-track" role="progressbar" aria-label="Collection progress" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.processed}><span className="progress-fill" style={{ transform: `scaleX(${progress.total ? progress.processed / progress.total : 0})` }} /></div><div className="collection-lock-note">Do not close this panel while the collection is running.</div></div></div>}
  </main>;
}

async function writeText(directory: FileSystemDirectoryHandle, filename: string, content: string) {
  await writeFile(directory, filename, content);
}

function collectionErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (['InvalidStateError', 'NotReadableError', 'NoModificationAllowedError'].includes(error.name)) {
      return 'The destination file changed or is busy. Close it in other apps, then retry this frame.';
    }
    if (error.name === 'NotAllowedError') return 'Folder access was denied. Choose your destination again.';
    return error.message;
  }
  return 'This frame could not be saved. Try again.';
}

async function convertImageFormat(source: Blob, format: ImageFormat): Promise<{ blob: Blob; mimeType: string }> {
  if (format === 'original') return { blob: source, mimeType: source.type || 'application/octet-stream' };
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The image converter could not create a drawing surface.');
  if (format === 'jpg') {
    context.fillStyle = '#f4efe6';
  }
  try {
    const bitmap = await createImageBitmap(source);
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    if (format === 'jpg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); }
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
  } catch {
    const objectUrl = URL.createObjectURL(source);
    try {
      const image = new Image();
      image.decoding = 'async';
      image.src = objectUrl;
      await image.decode();
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      if (format === 'jpg') { context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); }
      context.drawImage(image, 0, 0);
    } catch {
      throw new Error('The source image could not be decoded for PNG or JPG conversion. Choose Original for this frame.');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('The image could not be converted to the selected format.')), mimeType, 0.92);
  });
  return { blob, mimeType };
}

async function ensureDirectoryPermission(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const permissionHandle = handle as FileSystemDirectoryHandle & {
      queryPermission: (descriptor: { mode: 'readwrite' }) => Promise<PermissionState>;
      requestPermission: (descriptor: { mode: 'readwrite' }) => Promise<PermissionState>;
    };
    const current = await permissionHandle.queryPermission({ mode: 'readwrite' });
    if (current === 'granted') return;
    const requested = await permissionHandle.requestPermission({ mode: 'readwrite' });
    if (requested === 'granted') return;
  } catch {
    throw new Error('Destination folder permission expired. Choose the folder again before collecting.');
  }
  throw new Error('Destination folder permission was not granted. Choose the folder again before collecting.');
}

function buildCsv(records: Array<Record<string, unknown>>): string {
  const headers = ['candidateId', 'sourceImageUrl', 'localRelativePath', 'filename', 'mimeType', 'byteSize', 'sha256', 'status', 'failureMessage'];
  return [headers.join(','), ...records.map((record) => headers.map((header) => csvEscape(record[header])).join(','))].join('\n');
}

function supportedOriginForUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.hostname === 'www.behance.net' || url.hostname.endsWith('.behance.net')) return 'https://www.behance.net/*';
    if (url.hostname === 'dribbble.com' || url.hostname.endsWith('.dribbble.com')) return 'https://dribbble.com/*';
    return null;
  } catch {
    return null;
  }
}

function imagePermissionOrigin(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (url.hostname === 'behance.net' || url.hostname.endsWith('.behance.net')) return 'https://*.behance.net/*';
    if (url.hostname === 'dribbble.com' || url.hostname.endsWith('.dribbble.com')) return 'https://*.dribbble.com/*';
    return null;
  } catch {
    return null;
  }
}

async function persistFolderHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const database = await openFolderDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('handles', 'readwrite');
    transaction.objectStore('handles').put(handle, 'last-approved-folder');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function restoreFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const database = await openFolderDatabase();
    return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const transaction = database.transaction('handles', 'readonly');
      const request = transaction.objectStore('handles').get('last-approved-folder');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

function openFolderDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('framevault', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('handles');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
