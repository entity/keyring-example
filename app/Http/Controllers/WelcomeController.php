<?php

namespace App\Http\Controllers;

use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Writer;
use Database\Seeders\DatabaseSeeder;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;

class WelcomeController extends Controller
{
    /**
     * The demo's front page: what it is, and the two seeded accounts to sign
     * in with. The two-factor account's secret comes as a QR code too, so
     * an authenticator app can scan it instead of having it typed in.
     */
    public function __invoke(Google2FA $google2fa): Response
    {
        $url = $google2fa->getQRCodeUrl(config('app.name'), '2fa@keyring.test', DatabaseSeeder::TOTP_SECRET);
        $svg = new Writer(new ImageRenderer(new RendererStyle(144, 0), new SvgImageBackEnd))->writeString($url);

        return Inertia::render('welcome', [
            'demoAccounts' => [
                'password' => 'password',
                'totpSecret' => DatabaseSeeder::TOTP_SECRET,
                'recoveryCode' => DatabaseSeeder::RECOVERY_CODES[0],
                // Without the XML declaration, to go straight into the page.
                'totpQr' => trim(substr($svg, strpos($svg, "\n") + 1)),
            ],
        ]);
    }
}
