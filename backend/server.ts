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

app.get("/scraping", async (req, res) => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const url = "https://db.netkeiba.com/race/race_id/";
    const start_year: number = 2020; //取得開始年
    const end_year: number = 2023; //取得終了年

    //urlのrace_idを決める関数
    const race_id = () => {
      let race_id_list = [];
      const place_list = [
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
      ];
      for (let year = start_year; year < end_year + 1; year++) {
        race_id_list.push([year]);
        for (let place = 0; place < place_list.length; place++) {
          race_id_list.push([place_list[place]]);
          for (let day = 1; day < 13; day++) {
            race_id_list.push([day]);
            for (let race_num = 1; race_num < 13; race_num++) {
              race_id_list.push([race_num]);
            }
          }
        }
      }
    };

    await page.goto(url);
    const html = await page.content();

    await browser.close();

    const $ = cheerio.load(html);
    const tableRows = $("table").find("tr");

    const data: any[] = [];
    tableRows.each((_index, element) => {
      const row: any = {};
      $(element)
        .find("th, td")
        .each((_cellIndex, cell) => {
          const columnName = $(cell).text();
          row[`column_${_cellIndex}`] = columnName;
        });
      data.push(row);
    });

    if (data.length > 0) {
      const dataFrame = new DataFrame(data);
      saveRaceResultToJSON(dataFrame);

      const finalHTML = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"></head><body>${$(
        "table"
      )}</body></html>`;
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
