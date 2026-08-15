import { dates } from "./utils/dates.js";
import OpenAI from "openai";

const tickersArr = [];

const generateReportBtn = document.querySelector(".generate-report-btn");

generateReportBtn.addEventListener("click", fetchStockData);

document.getElementById("ticker-input-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const tickerInput = document.getElementById("ticker-input");
  if (tickerInput.value.length > 2) {
    generateReportBtn.disabled = false;
    const newTickerStr = tickerInput.value;
    tickersArr.push(newTickerStr.toUpperCase());
    tickerInput.value = "";
    renderTickers();
  } else {
    const label = document.getElementsByTagName("label")[0];
    label.style.color = "red";
    label.textContent =
      "You must add at least one ticker. A ticker is a 3 letter or more code for a stock. E.g TSLA for Tesla.";
  }
});

function renderTickers() {
  const tickersDiv = document.querySelector(".ticker-choice-display");
  tickersDiv.innerHTML = "";
  tickersArr.forEach((ticker) => {
    const newTickerSpan = document.createElement("span");
    newTickerSpan.textContent = ticker;
    newTickerSpan.classList.add("ticker");
    tickersDiv.appendChild(newTickerSpan);
  });
}

const loadingArea = document.querySelector(".loading-panel");
const apiMessage = document.getElementById("api-message");

async function fetchStockData() {
  document.querySelector(".action-panel").style.display = "none";
  loadingArea.style.display = "flex";
  try {
    const stockData = await Promise.all(
      tickersArr.map(async (ticker) => {
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${dates.startDate}/${dates.endDate}?apiKey=${import.meta.env.VITE_POLYGON_API_KEY}`;
        const response = await fetch(url);
        const data = await response.text();
        const status = await response.status;
        if (status === 200) {
          apiMessage.innerText = "Creating report...";
          return data;
        } else {
          loadingArea.innerText = "There was an error fetching stock data.";
        }
      }),
    );
    fetchReport(stockData.join(""));
  } catch (err) {
    loadingArea.innerText = "There was an error fetching stock data.";
    console.error("error: ", err);
  }
}

async function fetchReport(data) {
  const messages = [
    {
      role: "system",
      content:
        "You are a trading guru. Given data on share prices over the past 3 days, write a report of no more than 150 words descrinbing the stocks performance and recommending whether to buy, hold or sell. Use the examples provided between the ### separators to set the style of your response.",
    },
    {
      role: "user",
      content: `${data}
      ###
      Buckle up, buttercup! NVIDIA (NVDA) just went full rocket ship — opened at $118.40 and blasted off to $131.75 by day three, with barely a dip in between. This chip is cooking with gas! If you're holding NVDA, don't you dare blink — this train has more stops to make. Now Amazon (AMZN)? A little more of a rollercoaster, honey. Opened at $178.20, dipped to $171.05 mid-week, then clawed back to $176.60 by the close. Not dead, just catching its breath. My advice: ride the NVDA wave like it owes you money, and hold AMZN a little longer — patience pays when the horse is just stretching its legs, not lying down for good!
      ###
      Well butter my biscuit, Microsoft (MSFT) had itself a steady little climb — $402.10 to $411.85 over three days, smooth as a Sunday drive. Nothing flashy, just quiet money-making in the background, the way grandma likes her stocks. Hold it, love it, forget about it. Coinbase (COIN), on the other hand? Buckle in! Opened at $215.30, rocketed to $238.90, then took a nosedive back to $221.40 by close — this one's got more mood swings than a soap opera. If you've got the stomach for it, hang on for the next swing. If not, cash out now and sleep easy tonight, sugar!
      ###
      `,
    },
  ];

  try {
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      temperature: 1.1,
      presence_penalty: 0,
      frequency_penalty: 0,
    });
    renderReport(response.choices[0].message.content);
  } catch (err) {
    console.log("Error:", err);
    loadingArea.innerText = "Unable to access AI. Please refresh and try again";
  }
  /**
   * Challenge:
   * 1. Use the OpenAI API to generate a report advising
   * on whether to buy or sell the shares based on the data
   * that comes in as a parameter.
   *
   * 🎁 See hint.md for help!
   *
   * 🏆 Bonus points: use a try catch to handle errors.
   * **/
}

function renderReport(output) {
  loadingArea.style.display = "none";
  const outputArea = document.querySelector(".output-panel");
  const report = document.createElement("p");
  outputArea.appendChild(report);
  report.textContent = output;
  outputArea.style.display = "flex";
}
