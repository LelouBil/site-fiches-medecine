<script lang="ts">
    import "iconify-icon";
    import type {Difficulty} from "@/lib/questionSchema.ts";
    import {difficuly_map} from "@/lib/names.ts";

    export let difficulty: Difficulty;

    export let title: string | null = null;
    export let width: string = "1.8rem";
    export let height: string = "1.8rem";
    export let inline: boolean = true;
    export let color_class: string | null= null;
    export let clazz: string= "";
    // noinspection ReservedWordAsName
    export {clazz as class}

    const diffValues = difficuly_map[difficulty]
    console.log("difficulty: ", difficulty, "diffValues: ", diffValues)
</script>
<iconify-icon icon={diffValues.icon} class={(color_class || diffValues.color_class) + " " + clazz}
              width={width} height={height} title={title || null} inline={inline || null}></iconify-icon>