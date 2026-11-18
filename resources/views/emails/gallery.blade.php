{{-- The local-only gallery at /emails: every email the app sends, with sample content. --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <title>Emails · {{ config('app.name') }}</title>
    <style>
        :root {
            --bg: #faf9f8; --card: #fff; --ring: rgba(35, 34, 34, 0.08); --line: #ece8e6; --text: #181717; --body: #535150; --muted: #878382;
            --shadow: 0 1px 2px rgba(17, 16, 16, 0.04), 0 4px 12px -2px rgba(17, 16, 16, 0.05);
            --critical: #e5484d; --warning: #e8910c; --success: #16a36b; --info: #4b6fce;
        }
        @media (prefers-color-scheme: dark) {
            :root { --bg: #0b0a0a; --card: #161515; --ring: rgba(255, 255, 255, 0.07); --line: #262524; --text: #f6f4f4; --body: #c0bbba; --muted: #8f8a89; --shadow: none; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.5 Inter, ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        main { max-width: 1180px; margin: 0 auto; padding: 56px 24px 96px; }
        header { display: flex; gap: 14px; align-items: center; }
        header img { flex: none; border-radius: 11px; }
        h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.015em; }
        header p { margin: 2px 0 0; color: var(--muted); }
        code { font: 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
        section { margin-top: 48px; }
        h2 { display: flex; gap: 8px; align-items: baseline; margin: 0 0 16px; font-size: 14px; font-weight: 600; }
        h2 span { color: var(--muted); font-weight: 400; }
        ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; margin: 0; padding: 0; list-style: none; }
        li { position: relative; overflow: hidden; border-radius: 14px; background: var(--card); box-shadow: 0 0 0 1px var(--ring), var(--shadow); transition: box-shadow 0.15s ease; }
        li:hover { box-shadow: 0 0 0 1px var(--ring), 0 2px 4px rgba(17, 16, 16, 0.05), 0 12px 24px -6px rgba(17, 16, 16, 0.1); }
        .preview { position: relative; display: block; height: 280px; overflow: hidden; border-bottom: 1px solid var(--line); }
        .preview iframe { width: 600px; height: 660px; border: 0; transform: scale(0.45); transform-origin: 50% 0; margin-left: calc(50% - 300px); pointer-events: none; }
        .preview::after { content: ''; position: absolute; inset: auto 0 0; height: 56px; background: linear-gradient(to bottom, transparent, var(--card)); }
        .about { padding: 14px 16px 15px; }
        .subject { display: flex; gap: 8px; align-items: center; margin: 0; font-weight: 600; letter-spacing: -0.005em; }
        .subject a { color: inherit; text-decoration: none; }
        .subject a::before { content: ''; position: absolute; inset: 0; }
        .dot { flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--muted); }
        .dot.critical { background: var(--critical); } .dot.warning { background: var(--warning); } .dot.success { background: var(--success); } .dot.info { background: var(--info); }
        .meta { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 6px; padding-left: 15px; color: var(--muted); font-size: 13px; }
        .meta code { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .meta a { position: relative; z-index: 1; flex: none; color: var(--body); text-decoration: none; }
        .meta a:hover { color: var(--text); text-decoration: underline; }
        @media (max-width: 600px) { main { padding: 32px 16px 64px; } section { margin-top: 36px; } }
    </style>
</head>
<body>
<main>
    <header>
        <img src="{{ \Keyring\Facades\Keyring::linkRoot() }}/images/emails/logo.png" width="40" height="40" alt="">
        <div>
            <h1>Emails</h1>
            <p>Every email {{ config('app.name') }} sends, with sample content. Built from the Maizzle templates in <code>resources/emails</code>.</p>
        </div>
    </header>

    @foreach ($groups as $group => $emails)
        <section>
            <h2>{{ $group }} <span>{{ $emails->count() }}</span></h2>
            <ul>
                @foreach ($emails as $email)
                    <li>
                        <div class="preview" aria-hidden="true">
                            <iframe src="{{ route('emails.show', $email['type']) }}" title="" tabindex="-1"></iframe>
                        </div>
                        <div class="about">
                            <p class="subject">
                                <span class="dot {{ $email['mail']->viewData['tone'] ?? '' }}"></span>
                                <a href="{{ route('emails.show', $email['type']) }}" data-email="{{ $email['type'] }}">{{ $email['mail']->subject }}</a>
                            </p>
                            <div class="meta">
                                <code>{{ $email['type'] }}</code>
                                <a href="{{ route('emails.text', $email['type']) }}">Plain text</a>
                            </div>
                        </div>
                    </li>
                @endforeach
            </ul>
        </section>
    @endforeach
</main>
</body>
</html>
