export namespace MapUtil {
    export function associate<Element, Key, T>(
        elements: Element[],
        keyGen: (elem: Element) => Key,
        valueGen: (elem: Element) => T,
    ): Map<Key, T> {
        const output: Map<Key, T> = new Map();
        for (const elem of elements) output.set(keyGen(elem), valueGen(elem));
        return output;
    }

    export function associate_with_array<Element, Key, T>(
        elements: Element[],
        keyGen: (elem: Element) => Key,
        valueGen: (elem: Element) => T,
    ): Map<Key, T[]> {
        const dict: Map<Key, T[]> = new Map();
        for (const elem of elements) {
            const key: Key = keyGen(elem);
            const array: T[] = take(dict, key, () => []);
            array.push(valueGen(elem));
        }
        return dict;
    }

    export function take<Key, T>(
        dict: Map<Key, T>,
        key: Key,
        generator: () => T,
        recollector?: (value: T) => void,
    ): T;

    export function take<Key extends object, T>(
        dict: Map<Key, T> | WeakMap<Key, T>,
        key: Key,
        generator: () => T,
        recollector?: (value: T) => void,
    ): T;

    export function take<Key extends object, T>(
        dict: Map<Key, T> | WeakMap<Key, T>,
        key: Key,
        generator: () => T,
        recollector?: (value: T) => void,
    ): T {
        const oldbie: T | undefined = dict.get(key);
        if (oldbie !== undefined) {
            if (recollector) recollector(oldbie);
            return oldbie;
        }

        const value: T = generator();
        dict.set(key, value);
        return value;
    }
}
