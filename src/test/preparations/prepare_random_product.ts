import { randint } from "tstl/algorithm/random";
import safe from "../..";
import { RandomGenerator } from "../internal/RandomGenerator";
import { BbsProduct } from "../models/BbsProduct";

export function prepare_random_product(): BbsProduct
{
    return BbsProduct.initialize({
        id: safe.DEFAULT,
        manufacturer: RandomGenerator.name(),
        name: RandomGenerator.name(),
        price: randint(10, 100) * 1000,
    });
}