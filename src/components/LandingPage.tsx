import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    useEffect(() => {
        // Scroll-triggered fade-in
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1 }
        );
        document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

        // Nav shrink on scroll
        const handleScroll = () => {
            const nav = document.querySelector('.landing-nav') as HTMLElement;
            if (nav) nav.style.padding = window.scrollY > 60 ? '10px 24px' : '16px 24px';
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className="landing-page">
            <div className="ambient-bg" />
            <div className="noise" />

            {/* Nav */}
            <nav className="landing-nav">
                <div className="nav-inner">
                    <a href="#" className="logo">
                        <img src="/logo.svg" alt="SketchVibe" className="logo-icon" style={{ width: 28, height: 28, borderRadius: 6 }} />
                        SketchVibe
                    </a>
                    <div className="nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How It Works</a>
                        <a href="#providers">Providers</a>
                        <a href="https://github.com/mohdhd/sketchvibe" target="_blank" rel="noopener noreferrer">
                            GitHub
                        </a>
                    </div>
                    <Link to="/chat" className="nav-cta">
                        Launch App →
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-badge">
                    <span>✦</span> Free &amp; Open Source — No account needed
                </div>
                <h1>
                    AI Chat,
                    <br />
                    <span className="gradient-text">Beautifully Rendered</span>
                </h1>
                <p className="hero-sub">
                    Transform AI conversations into stunning visual canvases with cards, charts, tables, and more.
                    Local-first, bring your own keys, voice-enabled.
                </p>
                <div className="hero-actions">
                    <Link to="/chat" className="btn-primary">
                        Start Chatting — Free
                    </Link>
                    <a
                        href="https://github.com/mohdhd/sketchvibe"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                    >
                        ⭐ Star on GitHub
                    </a>
                </div>
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                    <a
                        href="https://www.producthunt.com/products/sketchvibe-talk-to-llms-the-right-way?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-sketchvibe"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1081006&theme=light&t=1771449244377"
                            alt="SketchVibe on Product Hunt"
                            width="250"
                            height="54"
                        />
                    </a>
                </div>
                <div className="hero-img-wrap">
                    <div className="hero-glow" />
                    <img src="/hero.png" alt="SketchVibe — AI chat with visual blocks" />
                </div>
            </section>

            {/* Providers */}
            <section className="providers-section" id="providers">
                <p className="providers-label">Bring Your Own Keys — Works With</p>
                <div className="providers-row">
                    <div className="provider-chip">
                        <span className="emoji">🟢</span> OpenAI
                    </div>
                    <div className="provider-chip">
                        <span className="emoji">🟠</span> Anthropic
                    </div>
                    <div className="provider-chip">
                        <span className="emoji">🔵</span> Google Gemini
                    </div>
                    <div className="provider-chip">
                        <span className="emoji">⚡</span> xAI Grok
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="landing-section" id="features">
                <div className="section-header fade-in">
                    <p className="section-label">Features</p>
                    <h2 className="section-title">Everything you need, nothing you don't</h2>
                    <p className="section-desc">
                        A powerful AI chat experience that respects your privacy and presents information the way your
                        brain wants to see it.
                    </p>
                </div>
                <div className="features-grid">
                    {[
                        {
                            icon: '🎨',
                            title: 'Canvas Studio',
                            desc: 'Design custom visual themes via AI conversation. Colors, typography, layout — describe your vibe and watch it come alive.',
                        },
                        {
                            icon: '📊',
                            title: 'Visual Blocks',
                            desc: 'AI responses render as cards, tables, charts, step flows, comparisons, and more — not boring markdown walls.',
                        },
                        {
                            icon: '🔐',
                            title: '100% Local-First',
                            desc: 'All data stays in your browser. No accounts, no server storage. Export/import your conversations anytime.',
                        },
                        {
                            icon: '🎙️',
                            title: 'Voice Chat',
                            desc: 'Speak to your AI and hear it respond. Supports OpenAI Whisper, ElevenLabs Scribe for STT, and multiple TTS voices.',
                        },
                        {
                            icon: '🌐',
                            title: 'Web Search',
                            desc: 'Ground AI responses in real-time web data with Tavily integration. Get cited, sourced answers.',
                        },
                        {
                            icon: '📎',
                            title: 'File & Image Upload',
                            desc: 'Attach images, code files, and documents. Multimodal support across all providers.',
                        },
                    ].map((f, i) => (
                        <div key={i} className="feature-card fade-in">
                            <div className="feature-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="landing-section" id="how-it-works">
                <div className="section-header fade-in">
                    <p className="section-label">How It Works</p>
                    <h2 className="section-title">Up and running in 60 seconds</h2>
                </div>
                <div className="steps-grid fade-in">
                    {[
                        {
                            title: 'Add Your API Key',
                            desc: 'Paste your OpenAI, Anthropic, Gemini, or Grok key. It never leaves your browser.',
                        },
                        {
                            title: 'Pick a Canvas',
                            desc: 'Choose from a library or generate a custom visual theme with the AI Canvas Studio.',
                        },
                        {
                            title: 'Start Chatting',
                            desc: 'Ask anything — your responses render as beautiful, structured visual blocks.',
                        },
                    ].map((s, i) => (
                        <div key={i} className="step-card">
                            <div className="step-num">{i + 1}</div>
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats */}
            <div className="stats-row fade-in">
                {[
                    { value: '4', label: 'AI Providers' },
                    { value: '0', label: 'Data Sent to Servers' },
                    { value: '∞', label: 'Conversations' },
                    { value: '100%', label: 'Free & Open Source' },
                ].map((s, i) => (
                    <div key={i} className="stat">
                        <h2>{s.value}</h2>
                        <p>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <section className="cta-section">
                <div className="cta-card fade-in">
                    <h2>Ready to see AI differently?</h2>
                    <p>
                        No sign-up. No tracking. No data collection.
                        <br />
                        Just beautiful, private AI conversations.
                    </p>
                    <Link to="/chat" className="btn-primary">
                        Launch SketchVibe →
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>
                    Made with ♥ —{' '}
                    <a href="https://github.com/mohdhd/sketchvibe" target="_blank" rel="noopener noreferrer">
                        Open Source on GitHub
                    </a>
                    &nbsp;·&nbsp; All data stays in your browser
                </p>
            </footer>
        </div>
    );
}
