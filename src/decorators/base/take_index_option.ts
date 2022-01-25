export function take_index_option<Option extends { index?: boolean }>
    (option: Option): Omit<Option, "index">
{
    const output: Option = { ...option };
    if (output.index === true)
        delete output.index;
    return output;
}