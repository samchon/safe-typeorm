import { randint } from "tstl/algorithm/random";
import { back_inserter } from "tstl/iterator/factory";
import { sample as _Sample } from "tstl/ranges/algorithm/random";

import { ArrayUtil } from "../../../utils/ArrayUtil";

export namespace RandomGenerator {
    /* ----------------------------------------------------------------
        IDENTIFICATIONS
    ---------------------------------------------------------------- */
    const CHARACTERS = "abcdefghijklmnopqrstuvwxyz";

    export function alphabets(length: number): string {
        return new Array(length)
            .fill("")
            .map(() => CHARACTERS[randint(0, CHARACTERS.length - 1)])
            .join("");
    }

    export function name(length: number = 3): string {
        return paragraph(length);
    }

    export function paragraph(
        sentences: number,
        wordMin: number = 3,
        wordMax: number = 7,
    ): string {
        return ArrayUtil.repeat(sentences, () =>
            alphabets(randint(wordMin, wordMax)),
        ).join(" ");
    }

    export function content(
        paragraphes: number,
        sentenceMin: number = 10,
        sentenceMax: number = 40,
        wordMin: number = 1,
        wordMax: number = 7,
    ): string {
        return ArrayUtil.repeat(paragraphes, () =>
            paragraph(randint(sentenceMin, sentenceMax), wordMin, wordMax),
        ).join("\n\n");
    }

    export function partial(content: string): string {
        const first: number = randint(0, content.length - 1);
        const last: number = randint(first + 1, content.length);

        return content.substring(first, last).trim();
    }

    export function mobile(): string {
        return `010${digit(3, 4)}${digit(4, 4)}`;
    }

    export function digit(minC: number, maxC: number): string {
        const val: number = randint(0, Math.pow(10.0, maxC) - 1);
        const log10: number = val ? Math.floor(Math.log10(val)) + 1 : 0;
        const prefix: string = "0".repeat(Math.max(0, minC - log10));

        return prefix + val.toString();
    }

    export function date(from: Date, range: number): Date {
        const time: number = from.getTime() + randint(0, range);
        return new Date(time);
    }

    export function sample<T>(array: T[], count: number): T[] {
        const ret: T[] = [];
        _Sample(array, back_inserter(ret), count);
        return ret;
    }

    export function pick<T>(array: T[]): T {
        return array[randint(0, array.length - 1)];
    }

    export function ip(): string {
        return ArrayUtil.repeat(4, () => randint(0, 255)).join(".");
    }
}
