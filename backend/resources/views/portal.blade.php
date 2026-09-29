<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>HolisticBooks Publishing Platform</title>
    <meta name="description" content="Portail HolisticBooks pour auteurs, équipe éditoriale et opérations.">
    <style>
        :root {
            color-scheme: light;
            --ink: #10251c;
            --forest: #12372a;
            --forest-2: #1e5a43;
            --gold: #f2c46d;
            --cream: #fbf7ef;
            --paper: #ffffff;
            --line: rgba(18,55,42,.12);
            --muted: #6b756f;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: var(--ink);
            background:
                radial-gradient(circle at top right, rgba(242,196,109,.28), transparent 30%),
                radial-gradient(circle at bottom left, rgba(30,90,67,.12), transparent 34%),
                var(--cream);
        }
        .shell { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 28px 0 56px; }
        .topbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .brand { display: flex; align-items: center; gap: 12px; font-weight: 800; letter-spacing: -.02em; }
        .brand img { width: 46px; height: 46px; border-radius: 14px; box-shadow: 0 10px 30px rgba(18,55,42,.16); }
        .status { display: inline-flex; align-items: center; gap: 8px; padding: 9px 13px; border: 1px solid var(--line); border-radius: 999px; background: rgba(255,255,255,.72); color: var(--muted); font-size: 13px; }
        .dot { width: 9px; height: 9px; border-radius: 50%; background: #31a56b; box-shadow: 0 0 0 4px rgba(49,165,107,.12); }
        .hero { padding: 88px 0 54px; max-width: 880px; }
        .eyebrow { display: inline-flex; padding: 8px 12px; border-radius: 999px; background: #fff3d9; color: #8b5d10; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .14em; }
        h1 { margin: 20px 0 18px; font-size: clamp(48px, 7vw, 86px); line-height: .96; letter-spacing: -.065em; }
        .hero p { max-width: 760px; margin: 0; color: var(--muted); font-size: clamp(18px, 2vw, 22px); line-height: 1.65; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
        .card {
            position: relative;
            overflow: hidden;
            min-height: 330px;
            padding: 30px;
            border: 1px solid var(--line);
            border-radius: 30px;
            text-decoration: none;
            color: inherit;
            background: rgba(255,255,255,.86);
            box-shadow: 0 24px 70px rgba(18,55,42,.08);
            transition: transform .22s ease, box-shadow .22s ease;
        }
        .card:hover { transform: translateY(-5px); box-shadow: 0 30px 86px rgba(18,55,42,.14); }
        .card.primary { background: linear-gradient(145deg, #12372a, #1d6047); color: white; }
        .card.primary p, .card.primary .meta { color: rgba(255,255,255,.72); }
        .icon { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 18px; background: #fff3d9; color: #8b5d10; font-size: 26px; }
        .primary .icon { background: rgba(255,255,255,.12); color: var(--gold); }
        h2 { margin: 32px 0 12px; font-size: 31px; letter-spacing: -.04em; }
        .card p { margin: 0; max-width: 520px; color: var(--muted); line-height: 1.7; }
        .meta { position: absolute; left: 30px; bottom: 28px; right: 30px; display: flex; justify-content: space-between; align-items: center; gap: 16px; color: var(--muted); font-size: 13px; font-weight: 700; }
        .arrow { font-size: 22px; }
        .features { margin-top: 22px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .feature { padding: 18px; border: 1px solid var(--line); border-radius: 20px; background: rgba(255,255,255,.62); }
        .feature strong { display: block; margin-bottom: 6px; font-size: 14px; }
        .feature span { color: var(--muted); font-size: 12px; line-height: 1.5; }
        footer { margin-top: 34px; padding-top: 24px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; gap: 18px; color: var(--muted); font-size: 12px; }
        @media (max-width: 800px) {
            .grid, .features { grid-template-columns: 1fr; }
            .hero { padding-top: 58px; }
            .card { min-height: 300px; }
            footer { flex-direction: column; }
        }
    </style>
</head>
<body>
    <main class="shell">
        <header class="topbar">
            <div class="brand">
                <img src="{{ asset('images/holisticbooks-mark.svg') }}" alt="">
                <span>HolisticBooks Publishing Platform</span>
            </div>
            <span class="status"><span class="dot"></span> API opérationnelle</span>
        </header>

        <section class="hero">
            <span class="eyebrow">Publishing infrastructure for Africa</span>
            <h1>Publier, distribuer et rémunérer les auteurs autrement.</h1>
            <p>
                Une plateforme éditoriale pensée pour le livre numérique et imprimé, les marchés africains,
                les ventes institutionnelles, le Mobile Money et le pilotage professionnel des revenus.
            </p>
        </section>

        <section class="grid">
            <a href="/studio" class="card primary">
                <div class="icon">✦</div>
                <h2>Author Studio</h2>
                <p>
                    Préparez vos livres, soumettez-les à validation, configurez vos marchés,
                    suivez vos ventes, vos royalties et vos versements.
                </p>
                <div class="meta">
                    <span>Auteurs & éditeurs</span>
                    <span class="arrow">→</span>
                </div>
            </a>

            <a href="/admin" class="card">
                <div class="icon">⌁</div>
                <h2>Control Center</h2>
                <p>
                    Gérez le catalogue, les auteurs, la qualité éditoriale, les paiements,
                    les abonnements, les contenus, les distributions et les opérations financières.
                </p>
                <div class="meta">
                    <span>Équipe HolisticBooks</span>
                    <span class="arrow">→</span>
                </div>
            </a>
        </section>

        <section class="features">
            <div class="feature"><strong>Distribution africaine</strong><span>Marchés locaux, librairies, institutions, web et mobile.</span></div>
            <div class="feature"><strong>Royalties transparentes</strong><span>Ledger par vente, taux configurables et historique auteur.</span></div>
            <div class="feature"><strong>Mobile Money</strong><span>Comptes de versement adaptés aux usages locaux et bancaires.</span></div>
            <div class="feature"><strong>Publishing workflow</strong><span>Manuscrit, couverture, droits, validation et préparation à la publication.</span></div>
        </section>

        <footer>
            <span>HolisticBooks · Publishing technology for African creators</span>
            <span>Laravel API · MySQL · Filament · Sanctum</span>
        </footer>
    </main>
</body>
</html>
