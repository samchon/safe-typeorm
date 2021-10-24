// import { v4 } from "uuid";
// import safe from "../..";
// import { ArrayUtil } from "../internal/ArrayUtil";
// import { RandomGenerator } from "../internal/RandomGenerator";
// import { TestLogger } from "../internal/TesLogger";
// import { AttachmentFile } from "../models/bbs/AttachmentFile";

// export async function test_parameter_binding(): Promise<void>
// {
//     const files: AttachmentFile[] = await ArrayUtil.repeat
//     (
//         100000,
//         () => AttachmentFile.initialize({
//             id: safe.DEFAULT,
//             name: RandomGenerator.name(),
//             extension: "jpg",
//             url: "http://localhost/" + v4() + ".jpg"
//         })
//     );
//     const collection: safe.InsertCollection = new safe.InsertCollection();
//     collection.push(files);
//     await collection.execute();

//     TestLogger.queue.clear();
//     const reload: AttachmentFile[] = await AttachmentFile.findByIds(files.map(x => x.id));
//     console.log(TestLogger.queue.size(), reload.length);
// }