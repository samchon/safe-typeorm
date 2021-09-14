import { randint } from "tstl/algorithm/random";

import safe from "../../..";
import { AttachmentFile } from "../../models/AttachmentFile";

import { RandomGenerator } from "../procedures/RandomGenerator";

export function prepare_random_attachment_file(extension?: string): AttachmentFile
{
    const directory: string = RandomGenerator.alphabets(20);
    const name: string = RandomGenerator.alphabets(randint(5, 16));

    if (extension === undefined)
        extension = RandomGenerator.alphabets(3);
        
    const url: string = `http://127.0.0.1/files/${directory}/${name}.${extension}`;

    return AttachmentFile.initialize({
        id: safe.DEFAULT,
        name,
        extension,
        url
    });
}