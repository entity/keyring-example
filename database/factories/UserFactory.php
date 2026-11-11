<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Keyring\Models\Authenticator;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Give the user an authenticator app, the second factor everyone needs
     * before the app lets them past Settings → Security.
     */
    public function withSecondFactor(): static
    {
        return $this->afterCreating(function (User $user) {
            Authenticator::factory()->totp()->default()->for($user, 'authenticatable')->create();
        });
    }

    /**
     * Indicate that the model's email address should be unverified. Such an
     * account can't sign in until it has followed its verification link.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
