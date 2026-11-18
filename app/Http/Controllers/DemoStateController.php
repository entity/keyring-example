<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Keyring\Enums\Category;
use Keyring\Enums\Purpose;
use Keyring\Factors\EmailCode;
use Keyring\Factors\Password;
use Keyring\Factors\RecoveryCodes;
use Keyring\Factors\Totp;
use Keyring\KeyringManager;
use Keyring\Login\AttemptStore;
use Keyring\Login\Requirement;
use Keyring\Login\SignIn;
use Keyring\Login\Verification;

/**
 * Local only: drops the browser straight into one state of the app, signed
 * in or halfway through a sign in as one of the demo accounts, so each page
 * can be tried without walking the whole flow first. `php artisan
 * example:links` prints a signed, expiring link to each one.
 */
class DemoStateController
{
    /**
     * Each state, with what the link list says about it.
     *
     * @var array<string, string>
     */
    public const array STATES = [
        'welcome' => 'The welcome page, signed out',
        'login' => 'The sign-in page, with the demo accounts and the location picker',
        'register' => 'Create an account',
        'forgot-password' => 'Ask for a password reset link',
        'challenge-app' => 'Signing in: the authenticator app code (2fa@keyring.test)',
        'challenge-email' => 'Signing in somewhere risky: a code sent by email, for an account without a second factor (demo@keyring.test, which gets emailed codes turned on)',
        'challenge-recovery' => 'Signing in: a recovery code (2fa@keyring.test)',
        'add-two-factor' => 'Signed in with only a password, asked to add a second factor (demo@keyring.test)',
        'dashboard' => 'Signed in: the dashboard (2fa@keyring.test)',
        'security' => 'Signed in: Settings → Security (2fa@keyring.test)',
        'confirm' => 'Signed in an hour ago, so Security asks to confirm it\'s you first (2fa@keyring.test)',
        'profile' => 'Signed in: Settings → Profile (2fa@keyring.test)',
        'emails' => 'The gallery of every email the app sends',
        'reset' => 'Put both demo accounts back the way they started, then sign in',
    ];

    public function __invoke(Request $request, string $state, KeyringManager $keyring, AttemptStore $attempts, SignIn $signIn): RedirectResponse
    {
        // Every link starts from a signed-out browser.
        if ($keyring->guard()->check()) {
            $signIn->out($request);
        } else {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        if ($state === 'reset') {
            Artisan::call('example:reset');

            return to_route('login');
        }

        $twoFactor = fn () => User::query()->where('email', '2fa@keyring.test')->firstOrFail();

        return match ($state) {
            'welcome' => to_route('home'),
            'login' => to_route('login'),
            'register' => to_route('register'),
            'forgot-password' => to_route('password.request'),
            'challenge-app' => $this->challenge($keyring, $attempts, $twoFactor(), Totp::KEY),
            'challenge-email' => $this->emailCode($keyring, $attempts),
            'challenge-recovery' => $this->challenge($keyring, $attempts, $twoFactor(), RecoveryCodes::KEY),
            'add-two-factor' => $this->signIn($request, $signIn, User::query()->where('email', 'demo@keyring.test')->firstOrFail(), 'security.edit', withTotp: false),
            'dashboard' => $this->signIn($request, $signIn, $twoFactor(), 'dashboard'),
            'security' => $this->signIn($request, $signIn, $twoFactor(), 'security.edit'),
            'confirm' => $this->signIn($request, $signIn, $twoFactor(), 'security.edit', at: now()->subHour()->getTimestamp()),
            'profile' => $this->signIn($request, $signIn, $twoFactor(), 'profile.edit'),
            'emails' => to_route('emails.index'),
            // The route only takes the states above, but one added to the
            // list without a line here shouldn't land anywhere.
            default => abort(404),
        };
    }

    /**
     * A sign in that got past the password, waiting on the given factor.
     */
    protected function challenge(KeyringManager $keyring, AttemptStore $attempts, User $user, string $factor, ?Requirement $requirement = null): RedirectResponse
    {
        $attempt = $attempts->start(Purpose::Login, $user, verifications: [$this->password(time())]);
        $attempt->requirement = $requirement ?? $keyring->requirementFor($user, $attempt);
        $attempts->save($attempt);

        return to_route('keyring.login.challenge', ['factor' => $factor]);
    }

    /**
     * What a risky sign in asks of an account with only a password and
     * emailed codes turned on: a second step, the code. Turns the codes on
     * for the demo account first, as Settings → Security would.
     */
    protected function emailCode(KeyringManager $keyring, AttemptStore $attempts): RedirectResponse
    {
        $user = User::query()->where('email', 'demo@keyring.test')->firstOrFail();

        $user->authenticators()->firstOrCreate(['factor' => EmailCode::KEY], ['name' => 'Email', 'secret' => null, 'confirmed_at' => now()]);

        return $this->challenge($keyring, $attempts, $user, EmailCode::KEY, Requirement::steps(2));
    }

    /**
     * Sign in as if the password, and the authenticator app unless told
     * otherwise, were just proved (or proved at the given time).
     */
    protected function signIn(Request $request, SignIn $signIn, User $user, string $route, bool $withTotp = true, ?int $at = null): RedirectResponse
    {
        $at ??= time();

        // Without the app, any emailed code the account has turned on (the
        // challenge-email link does that) counts as entered too.
        $email = $withTotp ? null : $user->keyring->of(EmailCode::KEY)->first();

        $signIn->as($request, $user, array_values(array_filter([
            $this->password($at),
            $withTotp ? new Verification(Totp::KEY, null, [Category::Possession], at: $at) : null,
            $email ? $this->at(Verification::of($email), $at) : null,
        ])));

        return to_route($route);
    }

    protected function at(Verification $verification, int $at): Verification
    {
        return new Verification($verification->factor, $verification->authenticator, $verification->categories, $verification->phishingResistant, $at, $verification->deviceBound, $verification->attested);
    }

    protected function password(int $at): Verification
    {
        return new Verification(Password::KEY, null, [Category::Knowledge], at: $at);
    }
}
