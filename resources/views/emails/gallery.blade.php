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
            --bg: #f4f4f5; --card: #fff; --border: #e4e4e7; --text: #09090b; --muted: #71717a; --link: #4f46e5;
            --critical: #ef4444; --warning: #f59e0b; --success: #10b981; --info: #6366f1;
        }
        @media (prefers-color-scheme: dark) {
            :root { --bg: #09090b; --card: #18181b; --border: #27272a; --text: #fafafa; --muted: #a1a1aa; --link: #818cf8; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 ui-sans-serif, system-ui, sans-serif; }
        main { max-width: 1200px; margin: 0 auto; padding: 48px 24px 80px; }
        header p { margin: 4px 0 0; color: var(--muted); }
        h1 { margin: 0; font-size: 24px; letter-spacing: -0.02em; }
        h2 { margin: 48px 0 16px; font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
        ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin: 0; padding: 0; list-style: none; }
        li { overflow: hidden; border: 1px solid var(--border); border-radius: 14px; background: var(--card); }
        .preview { position: relative; display: block; height: 260px; overflow: hidden; border-bottom: 1px solid var(--border); }
        .preview iframe { width: 640px; height: 760px; border: 0; transform: scale(0.42); transform-origin: 0 0; pointer-events: none; }
        .about { padding: 14px 16px 16px; }
        .subject { display: flex; gap: 8px; align-items: baseline; margin: 0; font-weight: 600; }
        .subject a { color: inherit; text-decoration: none; }
        .subject a:hover { text-decoration: underline; }
        .dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--info); transform: translateY(-1px); }
        .dot.critical { background: var(--critical); } .dot.warning { background: var(--warning); } .dot.success { background: var(--success); }
        .meta { display: flex; justify-content: space-between; gap: 8px; margin-top: 6px; font-size: 13px; color: var(--muted); }
        code { font: 12px ui-monospace, monospace; }
        .meta a { color: var(--link); text-decoration: none; }
    </style>
</head>
<body>
<main>
    <header>
        <h1>Emails</h1>
        <p>Every email {{ config('app.name') }} sends, with sample content. Built from the Maizzle templates in <code>resources/emails</code>.</p>
    </header>

    @foreach ($groups as $group => $emails)
        <h2>{{ $group }}</h2>
        <ul>
            @foreach ($emails as $email)
                <li>
                    <a class="preview" href="{{ route('emails.show', $email['type']) }}" tabindex="-1" aria-hidden="true">
                        <iframe src="{{ route('emails.show', $email['type']) }}" title=""></iframe>
                    </a>
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
    @endforeach
</main>
</body>
</html>
