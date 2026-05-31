/* Signature animated background — fixed, behind content.
   Three slow morphing liquid blobs in the palette accents plus a faint
   optical concentric field. All motion lives in CSS (tokens.css) so it's
   GPU-friendly and frozen automatically under prefers-reduced-motion. */
export default function FunkyBackground() {
  return (
    <div className="funky-bg" aria-hidden="true">
      <div className="funky-optical" />
      <div className="funky-blob funky-blob--a" />
      <div className="funky-blob funky-blob--b" />
      <div className="funky-blob funky-blob--c" />
    </div>
  )
}
