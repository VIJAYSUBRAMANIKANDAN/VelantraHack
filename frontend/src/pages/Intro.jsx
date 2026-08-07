import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { Volume2, VolumeX, SkipForward } from 'lucide-react'

// Straight-to-the-point intro: the video plays (muted-autoplay first, so
// the browser never blocks/throws — sound is offered right after via a
// one-tap unmute, and also unlocks on the very first user tap anywhere),
// then a smooth fade-to-black hands off into the Login page. No logo
// splash before or after — just video, then login.
export default function Intro() {
  const nav = useNavigate()
  const rootRef = useRef(null)
  const videoRef = useRef(null)
  const progressRef = useRef(null)
  const skipRef = useRef(null)
  const coverRef = useRef(null)
  const hasExited = useRef(false)

  const [muted, setMuted] = useState(true)
  const [videoFailed, setVideoFailed] = useState(false)
  const [showControls, setShowControls] = useState(false)

  const goToLogin = () => {
    if (hasExited.current) return
    hasExited.current = true

    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => nav('/login'),
    })

    tl.to(rootRef.current, { opacity: 0, duration: 0.5 }, 0)
      .to(coverRef.current, { opacity: 1, duration: 0.5 }, 0)
  }

  // Skip straight to login if the video can't play at all — never let a
  // broken media element block the funnel.
  const handleVideoError = () => {
    setVideoFailed(true)
    goToLogin()
  }

  const unlockSound = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = false
    setMuted(false)
    v.play().catch(() => {
      // Autoplay-with-sound was refused by the browser — fall back to
      // muted playback silently, no error surfaced to the user.
      v.muted = true
      setMuted(true)
    })
  }

  useEffect(() => {
    const v = videoRef.current
    if (v) {
      v.muted = true
      v.play().catch(() => {})
    }

    const tl = gsap.timeline()
    tl.fromTo(skipRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.3 })
      .call(() => setShowControls(true), null, 0)

    // Unlock sound on the very first tap/click anywhere on the intro —
    // standard, error-free way to satisfy browser autoplay-with-sound
    // policies.
    const firstInteract = () => unlockSound()
    window.addEventListener('pointerdown', firstInteract, { once: true })

    return () => {
      window.removeEventListener('pointerdown', firstInteract)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v || !v.duration || !progressRef.current) return
    const pct = (v.currentTime / v.duration) * 100
    progressRef.current.style.width = `${pct}%`
  }

  return (
    <div ref={rootRef} className="fixed inset-0 z-50 bg-black overflow-hidden select-none">
      {/* video layer */}
      <div className="absolute inset-0">
        {!videoFailed && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src="/intro.mp4"
            playsInline
            muted={muted}
            autoPlay
            onTimeUpdate={handleTimeUpdate}
            onEnded={goToLogin}
            onError={handleVideoError}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/40" />
      </div>

      {/* controls */}
      {showControls && !videoFailed && (
        <>
          <button
            onClick={unlockSound}
            aria-label={muted ? 'Unmute intro' : 'Sound on'}
            className="absolute top-6 right-6 flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-md
                       rounded-full px-3.5 py-2.5 min-h-[44px] border border-white/15 hover:bg-white/20 transition-colors"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            {muted && <span className="text-xs font-medium pr-0.5">Tap for sound</span>}
          </button>

          <button
            ref={skipRef}
            onClick={goToLogin}
            className="absolute bottom-8 right-6 flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-md
                       rounded-full px-4 py-2.5 min-h-[44px] border border-white/15 hover:bg-white/20 transition-colors text-sm font-medium"
          >
            Skip intro <SkipForward size={16} />
          </button>

          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
            <div ref={progressRef} className="h-full bg-growth w-0" />
          </div>
        </>
      )}

      {/* handoff cover — plain fade to black, no logo */}
      <div ref={coverRef} className="absolute inset-0 opacity-0 pointer-events-none bg-black" />
    </div>
  )
}
