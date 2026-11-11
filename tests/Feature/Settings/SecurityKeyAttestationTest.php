<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use App\Providers\KeyringServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Keyring\Enums\Assurance;
use Keyring\Testing\VirtualAuthenticator;
use Keyring\Testing\VirtualManufacturer;
use Tests\TestCase;

class SecurityKeyAttestationTest extends TestCase
{
    use RefreshDatabase;

    private const string YUBIKEY = '2fc0579f-8113-47ea-b116-bb5a8db9202a';

    private const string TITAN = '42b4fb4a-2866-43b2-9bf7-6c6669c2e5d3';

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    public function test_the_demo_takes_any_security_key()
    {
        $this->assertSame('none', $this->creationOptions('security-key')['attestation']);

        $this->add(new VirtualAuthenticator)->assertOk();

        $this->assertNull($this->user->authenticators()->where('factor', 'security-key')->sole()->attestation);
    }

    public function test_security_keys_have_to_prove_their_maker_once_the_setting_is_on()
    {
        $maker = new VirtualManufacturer;
        $this->requireAttestation($maker);

        $this->assertSame('direct', $this->creationOptions('security-key')['attestation']);

        $this->add(new VirtualAuthenticator)->assertJsonValidationErrors('credential');
        $this->add(new VirtualManufacturer()->key(self::YUBIKEY))->assertJsonValidationErrors('credential');
        $this->assertSame(0, $this->user->authenticators()->count());

        $this->add($maker->key(self::YUBIKEY))->assertOk();
        $this->assertSame('basic', $this->user->authenticators()->where('factor', 'security-key')->sole()->attestation);
    }

    public function test_passkeys_need_no_attestation_either_way()
    {
        $this->requireAttestation(new VirtualManufacturer);

        $this->assertSame('none', $this->creationOptions('passkey')['attestation']);

        $this->add(new VirtualAuthenticator, 'passkey')->assertOk();
    }

    public function test_only_the_listed_models_are_taken()
    {
        $maker = new VirtualManufacturer;
        $this->requireAttestation($maker, [self::YUBIKEY]);

        $this->add($maker->key(self::TITAN))->assertJsonValidationErrors('credential');
        $this->assertSame(0, $this->user->authenticators()->count());

        $this->add($maker->key(self::YUBIKEY))->assertOk();
        $this->assertSame(self::YUBIKEY, $this->user->authenticators()->where('factor', 'security-key')->sole()->aaguid);
    }

    /**
     * Boot the app's Keyring setup again, as with SECURITY_KEY_ATTESTATION
     * (and SECURITY_KEY_MODELS) set and the maker's root trusted.
     *
     * @param  list<string>  $models
     */
    private function requireAttestation(VirtualManufacturer $maker, array $models = []): void
    {
        config([
            'security_keys' => ['attestation' => true, 'models' => $models],
            'keyring.webauthn.attestation_roots' => [$maker->root],
        ]);

        new KeyringServiceProvider($this->app)->boot();
    }

    /**
     * The options the browser gets for a new key.
     *
     * @return array<string, mixed>
     */
    private function creationOptions(string $factor): array
    {
        return $this->actingAs($this->user)->withAssurance(Assurance::AAL2)
            ->postJson(route('keyring.authenticators.store', $factor))
            ->assertOk()
            ->json('enrollment.options');
    }

    private function add(VirtualAuthenticator $key, string $factor = 'security-key'): TestResponse
    {
        return $this->postJson(route('keyring.authenticators.confirm', $factor), [
            'credential' => $key->register($this->creationOptions($factor)),
        ]);
    }
}
