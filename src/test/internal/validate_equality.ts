function error<T>(x: T, y: T, depth: string): void
{
    throw new Error(`Different data has been detected on ${depth}: ${x} vs. ${y}`);
}

function validate_object<T extends object>(x: T, y: T, depth: string, ...excludes: string[]): void
{
    for (let key in x)
        if (excludes.findIndex(elem => elem === key) === -1)
            recursive(x[key], y[key], `${depth}.${key}`, ...excludes);
}

function validate_array<T>(x: T[], y: T[], depth: string, ...excludes: string[]): void
{
    if (x.length !== y.length)
        error(x.length, y.length, depth);

    x.forEach((value, index) => recursive(value, y[index], `${depth}[${index}]`, ...excludes));
}

function recursive<T>(x: T, y: T, depth: string, ...excludes: string[]): void
{
    let type = typeof x;
    if (type !== typeof y)
        error(x, y, depth);
    else if (type === "object")
        if (x instanceof Array)
            validate_array(x, y as typeof x, depth, ...excludes);
        else
            validate_object(<any>x as object, <any>y as object, depth, ...excludes);
    else if (x !== y)
        error(x, y, depth);
}

export function validate_equality<T>(x: T, y: T, ...excludes: string[]): void
{
    recursive(x, y, "$", ...excludes);
}