<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8" />
    <title>Pengajuan Pencairan Dana</title>
    <style>
        /* Mobile responsive */
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                border-radius: 0 !important;
            }

            .p-20 {
                padding: 15px !important;
            }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            body {
                background-color: #1a1a1a !important;
                color: #ffffff !important;
            }

            .container {
                background-color: #2a2a2a !important;
                color: #ffffff !important;
            }

            .footer {
                background-color: #1a1a1a !important;
                color: #bbbbbb !important;
            }

            a.button {
                background: #518fce !important;
                /* lebih terang agar tidak terlalu gelap */
                color: #ffffff !important;
            }

            h1,
            h2 {
                color: #ffffff !important;
            }
        }
    </style>
</head>

<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f5f5f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="padding:20px 0;">
        <tr>
            <td align="center">
                <!-- CONTAINER -->
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" class="container"
                    style="background:#ffffff; border-radius:8px; overflow:hidden; max-width:600px;">

                    <!-- HEADER -->
                    <tr>
                        <td style="background:#206BB0; padding:20px;" align="center">
                            {{-- <img src="{{ asset('storage/assets/logo.png') }}" alt="Benerin Indonesia" width="120"
                                height="auto" style="display:block; margin:0 auto 10px auto; max-width:120px;"> --}}
                            <h1 style="color:#ffffff; margin:0; font-size:20px; font-weight:600;">
                                Benerin Indonesia
                            </h1>
                        </td>
                    </tr>


                    <!-- BODY -->
                    <tr>
                        <td class="p-20" style="padding:20px;">
                            <h2 style="margin-top:0; font-size:18px; color:#333;">
                                Pengajuan Pencairan Dana
                            </h2>

                            <p style="font-size:14px; color:#555; line-height:1.6;">
                                Halo <strong>{{ $nama }}</strong>,<br><br>
                                Kami telah menerima permintaan pencairan dana Anda dengan rincian:
                            </p>

                            <table role="presentation" cellspacing="0" cellpadding="0" width="100%"
                                style="margin-top:20px; font-size:14px; color:#333;">
                                <tr>
                                    <td width="40%" style="padding: 8px 0; color:#666;">Jumlah</td>
                                    <td style="padding: 8px 0;">
                                        <strong>Rp{{ number_format($jumlah, 0, ',', '.') }}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td width="40%" style="padding: 8px 0; color:#666;">Status</td>
                                    <td style="padding: 8px 0;"><strong>{{ $status }}</strong></td>
                                </tr>
                                <tr>
                                    <td width="40%" style="padding: 8px 0; color:#666;">Bank Tujuan</td>
                                    <td style="padding: 8px 0;"><strong>{{ $bank }}</strong></td>
                                </tr>
                                <tr>
                                    <td width="40%" style="padding: 8px 0; color:#666;">No. Rekening</td>
                                    <td style="padding: 8px 0;"><strong>{{ $no_rek }}</strong></td>
                                </tr>
                                <tr>
                                    <td width="40%" style="padding: 8px 0; color:#666;">Atas Nama</td>
                                    <td style="padding: 8px 0;"><strong>{{ $atas_nama }}</strong></td>
                                </tr>
                            </table>

                            <!-- CTA BUTTON -->
                            <div style="text-align:center; margin-top:30px;">
                                <a class="button" href="{{ route('teknisi.payout.index') }}" target="_blank"
                                    style="background:#206BB0; color:#ffffff; text-decoration:none; padding:12px 24px; font-size:14px; border-radius:6px; display:inline-block;">
                                    Lihat Daftar Pengajuan
                                </a>
                            </div>

                            <p style="font-size:14px; color:#555; margin-top:30px; line-height:1.6;">
                                Kami akan segera memproses permintaan Anda. Terima kasih telah menggunakan layanan kami.
                            </p>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td class="footer"
                            style="background:#f5f5f5; padding:20px; text-align:center; font-size:12px; color:#777;">
                            <p style="margin:0;">
                                © {{ date('Y') }} Benerin Indonesia. Seluruh hak cipta dilindungi.
                            </p>
                            <p style="margin:5px 0 0 0;">
                                Email ini dikirim otomatis. Harap tidak membalas.
                            </p>
                        </td>
                    </tr>
                </table>
                <!-- END CONTAINER -->
            </td>
        </tr>
    </table>
</body>

</html>