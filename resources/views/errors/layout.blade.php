<!doctype html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">

    <title>@yield('title') — Benerin Indonesia</title>
    <meta name="robots" content="noindex">

    <!-- Font Poppins -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet">

    <link rel="icon" href="/storage/assets/icon.png" sizes="any">
    <link rel="icon" href="/storage/assets/icon.png" type="image/svg+xml">

    <style>
        :root {
            --primary: #206BB0;
            --secondary: #FFBD59;
            --red: #EF4444;
            --bg: #f8fafc;
            --text: #111827;
            --muted: #6b7280;
            --card: #ffffff;
            --border: #e5e7eb
        }

        * {
            box-sizing: border-box
        }

        html,
        body {
            height: 100%
        }

        body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
            font-family: 'Poppins', sans-serif;
        }

        .wrap {
            min-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px
        }

        .card {
            width: 100%;
            max-width: 640px;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 22px;
            box-shadow: 0 8px 24px rgba(2, 6, 23, .06);
            text-align: center
        }

        .logo {
            display: block;
            margin: 0 auto 10px;
            width: 150px;
            height: auto
        }

        .icon {
            display: grid;
            place-items: center;
            width: 88px;
            height: 88px;
            margin: 12px auto 14px;
            border-radius: 18px;
            background: var(--red);
            color: #fff;
            font-weight: 800;
            font-size: 32px;
        }

        h1 {
            margin: 6px 0;
            font-size: 24px;
            font-weight: 700;
        }

        p.lead {
            margin: 4px 0 0;
            color: var(--muted);
            font-size: 15px
        }

        .actions {
            margin-top: 18px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center
        }

        .btn {
            appearance: none;
            cursor: pointer;
            border: 1px solid var(--border);
            background: #fff;
            color: #111827;
            padding: 10px 16px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 14px;
            transition: .15s ease
        }

        .btn:active {
            transform: translateY(1px)
        }

        .btn-primary {
            background: var(--primary);
            border-color: var(--primary);
            color: #fff
        }

        .help {
            margin-top: 14px;
            color: var(--muted);
            font-size: 12px
        }

        a {
            color: var(--primary);
            text-decoration: none
        }

        @media (min-width:640px) {
            h1 {
                font-size: 26px
            }

            .icon {
                font-size: 36px
            }

            p.lead {
                font-size: 16px
            }
        }
    </style>
</head>

<body>
    <div class="wrap">
        <main class="card" role="main" aria-live="polite">

            <img src="/storage/assets/logo.png" alt="Benerin Indonesia" class="logo">

            <div class="icon">@yield('code')</div>

            <h1>@yield('title')</h1>
            <p class="lead">@yield('message')</p>

            <div class="actions">
                <button class="btn" onclick="history.back()">← Kembali</button>
                <a class="btn btn-primary" href="/">Ke Beranda</a>
            </div>

            @hasSection('help')
            <p class="help">@yield('help')</p>
            @endif

            <p class="help">Butuh bantuan? <a href="mailto:support@benerin.id">support@benerin.id</a></p>
        </main>
    </div>
</body>

</html>