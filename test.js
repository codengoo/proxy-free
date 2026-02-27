import { ProxyScrapeClient } from "./dist/index.mjs";

async function test() {
  const client = new ProxyScrapeClient();
  const results = await client.getBestRandom({
    country: "vn",
  });

  const isProxyWorking = await ProxyScrapeClient.checkProxy(results[0].proxy);
  console.log(results[0].proxy);
  console.log("Is proxy working:", isProxyWorking);
}

test();
