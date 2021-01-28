import { Model } from "../Model";
import { CreatorType } from "./CreatorType";

export type ModelCreatorType<T extends Model> = CreatorType<T> & typeof Model;