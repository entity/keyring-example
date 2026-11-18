<?php

namespace App\Http\Controllers;

use App\Support\DemoLocator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DemoLocationController extends Controller
{
    /**
     * The login page's "Pretend to be in" picker. It only puts this browser
     * somewhere else for the next sign in: what happens then is up to the
     * NewCountry and ImpossibleTravel signals. Only there with
     * KEYRING_LOCATOR=demo.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        abort_unless(DemoLocator::enabled(), 404);

        $place = $request->validate([
            'place' => ['required', 'string', Rule::in(array_keys(DemoLocator::PLACES))],
        ])['place'];

        return back()->withCookie(cookie(DemoLocator::COOKIE, $place, 60 * 24 * 30));
    }
}
