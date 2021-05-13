# Safe-TypeORM
With `safe-typeorm`, use `TypeORM` much safely.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/samchon/safe-typeorm/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/safe-typeorm.svg)](https://www.npmjs.com/package/safe-typeorm)
[![Downloads](https://img.shields.io/npm/dm/safe-typeorm.svg)](https://www.npmjs.com/package/safe-typeorm)
[![Build Status](https://github.com/samchon/safe-typeorm/workflows/build/badge.svg)](https://github.com/samchon/safe-typeorm/actions?query=workflow%3Abuild)




## Demonstration
![safe-typeorm-example-fastest](https://user-images.githubusercontent.com/13158709/117546527-ccdaaa00-b065-11eb-928c-082a84507431.gif)

<details>
<summary> Final Script </summary>

```ts
MarketOrderGood.createJoinQueryBuilder(good =>
{
    good.innerJoin("order").innerJoin("publish");
    good.innerJoin("commodity", commodity =>
    {
        commodity.innerJoin("cart").innerJoin("consumer").innerJoin("citizen");
        commodity.innerJoin("base", "CA", article =>
        {
            article.innerJoin("lastPair", "CAP").innerJoin("content", "CAC");
            article.innerJoin("sale", sale =>
            {
                sale.innerJoin("section");
                sale.innerJoin("__p_channels").innerJoin("channel");
            });
        });
    });
    good.leftJoin("revert")
        .leftJoin("base", "RA").leftJoin("lastPair", "RAP")
        .leftJoin("content", "RAC");
})
.andWhere(...MarketSale.getWhereArguments("seller", "=", seller))
.andWhere(...MarketChannel.getWhereArguments("code", "=", channelCode))
.andWhere(...MarketSection.getWhereArguments("code", "=", sectionCode))
.select([
    MarketOrderGood.getColumn("id"),
    Citizen.getColumn("name", "consumer"),
    MarketSale.getColumn("title", "sale_title"),
    MarketSaleArticleContent.getColumn("CAC.title", "order_good_title"),
    MarketSaleArticleContent.getColumn("RAC.title", "revert_title"),
    MarketCartCommodity.getColumn("volume"),
    MarketOrderPublish.getColumn("paid_at", "created_at")
]);
```

</details>

<details>
<summary> Generated SQL by the Script </summary>

```sql
SELECT `MarketOrderGood`.`id` AS `id`, 
    `Citizen`.`name` AS `consumer`, 
    `MarketSale`.`title` AS `sale_title`, 
    `CAC`.`title` AS `order_good_title`, 
    `RAC`.`title` AS `revert_title`, 
    `MarketCartCommodity`.`volume` AS `volume`, 
    `MarketOrderPublish`.`paid_at` AS `created_at` 
FROM `market_order_goods` `MarketOrderGood` 
    INNER JOIN `market_orders` `MarketOrder` 
        ON `MarketOrderGood`.`market_order_id` = `MarketOrder`.`id` AND 
            `MarketOrder`.`deleted_at` IS NULL  
    INNER JOIN `market_order_publishes` `MarketOrderPublish` 
        ON `MarketOrder`.`id` = `MarketOrderPublish`.`market_order_id`  
    INNER JOIN `market_cart_commodities` `MarketCartCommodity` 
        ON `MarketOrderGood`.`market_cart_commodity_id` = `MarketCartCommodity`.`id` 
    INNER JOIN `market_carts` `MarketCart` 
        ON `MarketCartCommodity`.`market_cart_id` = `MarketCart`.`id`  
    INNER JOIN `market_consumers` `MarketConsumer` 
        ON `MarketCart`.`market_consumer_id` = `MarketConsumer`.`id`  
    INNER JOIN `citizens` `Citizen` 
        ON `MarketConsumer`.`citizen_id` = `Citizen`.`id`  
    INNER JOIN `market_sale_articles` `CA` 
        ON `MarketCartCommodity`.`id` = `CA`.`id` AND 
            `CA`.`deleted_at` IS NULL  
    INNER JOIN `market_sales` `MarketSale` 
        ON `CA`.`market_sale_id` = `MarketSale`.`id` AND 
            `MarketSale`.`deleted_at` IS NULL  
    INNER JOIN `market_sections` `MarketSection` 
        ON `MarketSale`.`market_section_id` = `MarketSection`.`id` AND 
            `MarketSection`.`deleted_at` IS NULL  
    INNER JOIN `market_sale_channel_pairs` `MarketSaleChannelPair` 
        ON `MarketSale`.`id` = `MarketSaleChannelPair`.`market_sale_id`  
    INNER JOIN `market_channels` `MarketChannel` 
        ON `MarketSaleChannelPair`.`market_channel_id` = `MarketChannel`.`id` AND 
            `MarketChannel`.`deleted_at` IS NULL  
    INNER JOIN `market_sale_article_last_content_pairs` `CAP` 
        ON `CA`.`id` = `CAP`.`market_sale_article_id`  
    INNER JOIN `market_sale_article_contents` `CAC` 
        ON `CAP`.`market_sale_article_content_id` = `CAC`.`id`  
    LEFT JOIN `market_order_good_reverts` `MarketOrderGoodRevert` 
        ON `MarketOrderGood`.`id` = `MarketOrderGoodRevert`.`market_order_good_id`  
    LEFT JOIN `market_sale_articles` `RA` 
        ON `MarketOrderGoodRevert`.`id` = `RA`.`id` AND
            `RA`.`deleted_at` IS NULL  
    LEFT JOIN `market_sale_article_last_content_pairs` `RAP` 
        ON `RA`.`id` = `RAP`.`market_sale_article_id`  
    LEFT JOIN `market_sale_article_contents` `RAC` 
        ON `RAP`.`market_sale_article_content_id` = `RAC`.`id` 
WHERE `MarketSale`.`market_seller_id` = ? AND 
    `MarketChannel`.`code` = ? AND 
    `MarketSection`.`code` = ? AND 
    `MarketOrderPublish`.`paid_at` IS NOT NULL;
```

</details>