import { test, expect } from "@playwright/test";
import type { MetadataResponse } from "../src/lib/types";

test("should display welcome text on the front page", async ({ page }) => {
  await page.goto("http://localhost:5173"); 

  // Check if the page contains the text "Welcome to"
  const welcomeText = await page.locator("text=Welcome to WIS");
  await expect(welcomeText).toBeVisible();
});

test("should have different text when language is toggled", async ({
  page,
}) => {
  // Navigate to the app's front page
  await page.goto("http://localhost:5173"); 

  const welcomeText = page.locator("text=Welcome to WIS");
  await expect(welcomeText).toBeVisible();

  const settingsButton = page.locator('button:has-text("Settings")');
  await expect(settingsButton).toBeVisible();
  await settingsButton.click();

  const languageDropdown = page.getByText("en", { exact: true });
  await expect(languageDropdown).toBeVisible();
  await languageDropdown.click();

  const languageOption = page.locator("text=Español");
  await expect(languageOption).toBeVisible();
  await languageOption.click();

  const newWelcomeText = page.locator("text=Bienvenido");
  await expect(newWelcomeText).toBeVisible();
});

test("should have as many rows with maps as stations in the backend", async ({
  page,
}) => {
  // Navigate to the app's front page
  await page.goto("http://localhost:5173");

  // Make sure that the fetch to the backend to load the collections is successful
  await page.waitForResponse(
    (response) =>
      response.url().startsWith("http://localhost:8010/proxy/oapi") &&
      response.status() === 200
  );
  
  // this is a term that should be repeated for each station and nowhere else.
  const rows = page.getByText("Metadata Identifier: ");
  const numberOfStations = await rows.count();
  expect(
    numberOfStations,
    "No stations were detected on the front page"
  ).toBeGreaterThan(0);

  // on the front page, we have as many stations as there are items in the discovery metadata backend
  const response = await fetch(
    "http://localhost:8010/proxy/oapi/collections/discovery-metadata/items"
  );
  expect(response.ok).toBe(true);
  const jsonResp: MetadataResponse = await response.json();
  expect(jsonResp.numberMatched).toBe(numberOfStations);
  expect(jsonResp.numberReturned).toBe(numberOfStations);

});
