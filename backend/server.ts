import express from "express";
import puppeteer from "puppeteer";
import cheerio from "cheerio";
import { DataFrame } from "data-forge";
import fs from "fs";

const app: express.Express = express();
const port = 8000;

const saveRaceResultToJSON = (dataFrame: DataFrame) => {
  try {
    const jsonData = dataFrame.toJSON();
    fs.writeFileSync("RaceResultData.json", JSON.stringify(jsonData));
    console.log("データがJSONファイルに保存されました");
  } catch (error) {
    console.error("JSONファイルへの保存中にエラーが発生しました:", error);
  }
};

app.get("/scrape", async (req, res) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const url = "https://db.netkeiba.com/race/202309030811/";

    await page.goto(url);
    const html = await page.content();

    await browser.close();

    const $ = cheerio.load(html);
    const tableHTML = $("table").html();

    if (tableHTML !== null) {
      const dataFrame = new DataFrame([tableHTML]);
      saveRaceResultToJSON(dataFrame);

      const finalHTML = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"></head><body>${tableHTML}</body></html>`;
      res.header("Content-Type", "text/html; charset=utf-8");
      res.send(finalHTML);
    } else {
      res.status(500).send("HTML table not found");
    }
  } catch (error: any) {
    res.status(500).send((error as Error).message);
  }
});

app.listen(port, () => {
  console.log(`port ${port} でサーバー起動中`);
});
