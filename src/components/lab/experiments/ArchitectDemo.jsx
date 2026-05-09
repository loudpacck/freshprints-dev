import { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'

const CHECKS = [
  { status: 'pass',    name: 'TITLE BLOCK COMPLETENESS',   result: 'All required fields present' },
  { status: 'pass',    name: 'SHEET SIZE COMPLIANCE',       result: 'ANSI B detected, within standards' },
  { status: 'warning', name: 'DIMENSIONAL CONSISTENCY',     result: '2 dimensions missing tolerances' },
  { status: 'pass',    name: 'MULTI-VIEW ALIGNMENT',        result: 'Front, top, side views aligned' },
  { status: 'pass',    name: 'GD&T NOTATION',               result: 'Datum references valid' },
  { status: 'error',   name: 'TOLERANCE STACKUP',           result: 'Stack analysis exceeds spec on feature B-3' },
  { status: 'pass',    name: 'SURFACE FINISH CALLOUTS',     result: 'All machined surfaces specified' },
  { status: 'warning', name: 'MATERIAL SPECIFICATION',      result: 'Material grade abbreviated, recommend full spec' },
  { status: 'pass',    name: 'STANDARD HARDWARE',           result: 'ANSI B18.2.1 compliance verified' },
  { status: 'pass',    name: 'DRAWING SCALE',               result: '1:2 confirmed across all views' },
  { status: 'warning', name: 'REVISION BLOCK',              result: 'Revision block present but date missing' },
  { status: 'pass',    name: 'BILL OF MATERIALS',           result: 'BOM matches assembly callouts' },
]

const STATUS_ICON = {
  pass:    { symbol: '✓', color: 'var(--color-status-active)' },
  warning: { symbol: '⚠', color: 'var(--color-status-beta)' },
  error:   { symbol: '✗', color: 'var(--color-status-error)' },
}

const PROGRESS_LINES = [
  '// PARSING DRAWING...',
  '// CHECKING DIMENSIONS...',
  '// VALIDATING GD&T...',
]

const monoSm = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  letterSpacing: 'var(--tracking-wide)',
}

export default function ArchitectDemo() {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [visibleLines, setVisibleLines] = useState(0)
  const [report, setReport] = useState(null)
  const timerRefs = useRef([])

  function handleUpload() {
    setUploadedFile('drawing_rev_03.pdf')
    setReport(null)
  }

  function handleValidate() {
    setIsAnalyzing(true)
    setVisibleLines(0)
    setReport(null)

    timerRefs.current.push(setTimeout(() => setVisibleLines(1), 100))
    timerRefs.current.push(setTimeout(() => setVisibleLines(2), 700))
    timerRefs.current.push(setTimeout(() => setVisibleLines(3), 1400))
    timerRefs.current.push(setTimeout(() => {
      setReport(true)
      setIsAnalyzing(false)
    }, 2100))
  }

  useEffect(() => {
    return () => timerRefs.current.forEach(clearTimeout)
  }, [])

  const passCount = CHECKS.filter(c => c.status === 'pass').length
  const warnCount = CHECKS.filter(c => c.status === 'warning').length
  const errCount  = CHECKS.filter(c => c.status === 'error').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Upload zone */}
      <div
        onClick={handleUpload}
        style={{
          background: 'var(--color-bg-surface)',
          border: `2px dashed ${uploadedFile ? 'var(--color-status-active)' : 'var(--color-border-default)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-12)',
          cursor: 'pointer',
          transition: 'border-color var(--duration-base)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)',
          textAlign: 'center',
        }}
      >
        {uploadedFile ? (
          <>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="var(--color-status-active)" strokeWidth="2" />
              <path d="M12 20l6 6 10-12" stroke="var(--color-status-active)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-status-active)', margin: 0 }}>
              {uploadedFile}
            </p>
            <p style={{ ...monoSm, color: 'var(--color-text-muted)', margin: 0 }}>
              Click to replace
            </p>
          </>
        ) : (
          <>
            {/* Drawing icon */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="4" width="32" height="40" rx="2" stroke="var(--color-text-muted)" strokeWidth="2" />
              <path d="M8 12h32" stroke="var(--color-text-muted)" strokeWidth="1.5" />
              <path d="M8 36h32" stroke="var(--color-text-muted)" strokeWidth="1.5" />
              <path d="M16 20h16" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M16 26h10" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 36v8h32v-8" stroke="var(--color-text-muted)" strokeWidth="1.5" />
            </svg>

            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>
              DRAG &amp; DROP A DRAWING
            </p>
            <p style={{ ...monoSm, color: 'var(--color-text-muted)', margin: 0 }}>
              PDF, DWG, DXF, PNG accepted
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
              <div style={{ width: 40, height: 1, background: 'var(--color-border-subtle)' }} />
              <span style={{ ...monoSm, color: 'var(--color-text-muted)' }}>OR</span>
              <div style={{ width: 40, height: 1, background: 'var(--color-border-subtle)' }} />
            </div>

            <Button variant="secondary" size="sm" onClick={e => { e.stopPropagation(); handleUpload() }}>
              BROWSE FILES
            </Button>
          </>
        )}
      </div>

      {/* Validate button (shown after upload) */}
      {uploadedFile && !isAnalyzing && !report && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="primary" onClick={handleValidate}>
            VALIDATE DRAWING
          </Button>
        </div>
      )}

      {/* Progress lines */}
      {isAnalyzing && (
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-8)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          {PROGRESS_LINES.slice(0, visibleLines).map((line, i) => (
            <p
              key={i}
              style={{
                ...monoSm,
                color: 'var(--color-text-accent)',
                textTransform: 'uppercase',
                margin: 0,
                animation: 'fadeIn 0.3s ease both',
              }}
            >
              {line}
              {i === visibleLines - 1 && (
                <span style={{ animation: 'cursorBlink 1s infinite', marginLeft: 4 }}>█</span>
              )}
            </p>
          ))}
        </div>
      )}

      {/* Report */}
      {report && (
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            animation: 'fadeInUp 0.4s var(--ease-out-expo) both',
          }}
        >
          {/* Report header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-6)',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-2xl)',
                color: 'var(--color-text-primary)',
                margin: 0,
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              VALIDATION REPORT
            </h2>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: 'var(--color-status-beta)',
              }}
            >
              PASSED WITH WARNINGS
            </span>
          </div>

          {/* Summary line */}
          <p
            style={{
              ...monoSm,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-6)',
              paddingBottom: 'var(--space-6)',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            {CHECKS.length} CHECKS RUN |{' '}
            <span style={{ color: 'var(--color-status-active)' }}>{passCount} PASSED</span> |{' '}
            <span style={{ color: 'var(--color-status-beta)' }}>{warnCount} WARNINGS</span> |{' '}
            <span style={{ color: 'var(--color-status-error)' }}>{errCount} ERROR</span>
          </p>

          {/* Check list */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {CHECKS.map((check, i) => {
              const icon = STATUS_ICON[check.status]
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4) 0',
                    borderBottom: i < CHECKS.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-base)',
                      color: icon.color,
                      flexShrink: 0,
                      lineHeight: 1.4,
                      minWidth: 20,
                    }}
                  >
                    {icon.symbol}
                  </span>
                  <div>
                    <p
                      style={{
                        ...monoSm,
                        color: 'var(--color-text-primary)',
                        textTransform: 'uppercase',
                        margin: '0 0 var(--space-1)',
                        fontWeight: 'var(--weight-medium)',
                      }}
                    >
                      {check.name}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-secondary)',
                        margin: 0,
                      }}
                    >
                      {check.result}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Report footer */}
          <div
            style={{
              marginTop: 'var(--space-6)',
              paddingTop: 'var(--space-6)',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <p style={{ ...monoSm, color: 'var(--color-text-muted)', margin: 0 }}>
              // DEMO MODE: This is a simulated validation. Production version analyzes actual drawing files.
            </p>
            <Button variant="ghost" size="sm">
              DOWNLOAD FULL REPORT
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
