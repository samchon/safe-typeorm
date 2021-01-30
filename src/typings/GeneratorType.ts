import { CreatorType } from "./CreatorType";

export type GeneratorType<T extends object> = () => CreatorType<T>;