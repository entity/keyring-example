<!--
  The line mail apps show after the subject, when it holds Blade: Maizzle's
  <Preheader> only reads plain text, and drops what's in <Raw>. The filler
  after it keeps the start of the email out of that line.
-->
<template>
    <NotPlaintext>
        <div
            style="
                display: none;
                max-height: 0;
                overflow: hidden;
                mso-hide: all;
            "
        >
            <slot /><template v-for="i in 90" :key="i"
                >&#8199;&#65279;&#847; </template
            >&nbsp;
        </div>
    </NotPlaintext>
</template>
