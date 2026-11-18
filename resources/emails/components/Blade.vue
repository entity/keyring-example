<script lang="ts">
import { createStaticVNode } from 'vue';

/**
 * A Blade directive built in a template, like `@case ('info')` from a loop,
 * which <Raw> can't do: what's inside <Raw> is fixed before Vue runs.
 */
export default {
    props: { code: { type: String, required: true } },
    setup(props: { code: string }) {
        return () => createStaticVNode(props.code, 1);
    },
};
</script>
