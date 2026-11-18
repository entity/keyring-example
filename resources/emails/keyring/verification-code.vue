<!--
  The code for signing in with an email code, or for adding one as a sign-in
  method ($enrolling). $code comes in groups ("1234 5678"): each digit gets
  a box of its own, and a short bar stands between the groups.
-->
<template>
    <Shell>
        <template #preheader>
            <Preview>
                Enter it to finish. It expires in <Raw>{{ $minutes }}</Raw>
                minutes.
            </Preview>
        </template>

        <NotPlaintext>
            <Hero tone="info" icon="shield-check">Your verification code</Hero>
        </NotPlaintext>
        <Plaintext>Your verification code</Plaintext>

        <Raw>@if ($enrolling)</Raw>
        <Lead>
            Enter this code to finish adding your email address as a way to sign
            in. It expires in <Raw>{{ $minutes }}</Raw> minutes.
        </Lead>
        <Raw>@else</Raw>
        <Lead>
            Enter this code to finish signing in. It expires in
            <Raw>{{ $minutes }}</Raw> minutes.
        </Lead>
        <Raw>@endif</Raw>

        <NotPlaintext>
            <Spacer class="h-7" />
            <!--
              One box per digit, and an empty bar between the groups. Blade
              prints them with nothing in between, so copying the boxes
              gives the code alone ("12345678"). The empty {{ '' }} keeps
              @endif and @endforeach apart, which Blade needs, and the
              line below keeps the formatter from adding space.
            -->
            <!-- prettier-ignore -->
            <div class="text-center whitespace-nowrap"><Raw>@foreach (mb_str_split($code) as $char)</Raw><Raw>@if ($char === ' ')</Raw><span
                    class="mx-2 inline-block h-0.5 w-2.5 rounded-full bg-[#dfdad8] align-middle sm:mx-1.5 sm:w-2 dark:bg-[#3b3c40]"
                ></span><Raw>@else</Raw><span
                    class="mx-[3px] inline-block h-12 w-10 rounded-[10px] border border-solid border-[#dfdad8] bg-white text-center align-middle text-2xl/[46px] font-semibold text-[#111010] tabular-nums shadow-[0_1px_2px_0_rgba(17,16,16,0.06)] sm:mx-0.5 sm:h-10 sm:w-7 sm:rounded-lg sm:text-lg/[38px] dark:border-[#3b3c40] dark:bg-[#131417] dark:text-[#f1f2f4] dark:shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.3)]"
                ><Raw>{{ $char }}</Raw></span><Raw>@endif</Raw><Raw>{{ '' }}</Raw><Raw>@endforeach</Raw></div>
        </NotPlaintext>
        <Plaintext
            >Your code: <Raw>{{ $code }}</Raw></Plaintext
        >

        <Note
            >Don't share this code with anyone. We'll never ask you for
            it.</Note
        >

        <template #aside>
            <Raw>@if ($enrolling)</Raw>
            <Advice title="Didn't ask for this?">
                Someone may be signed in to your account. Change your password
                and check your sign-in methods straight away.
            </Advice>
            <Raw>@else</Raw>
            <Advice title="Didn't try to sign in?">
                Someone may know your password. Change it straight away.
            </Advice>
            <Raw>@endif</Raw>
        </template>
    </Shell>
</template>
