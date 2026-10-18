import { test, expect } from "@playwright/test";

test("page, navigation, assets and responsive layout", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "BeautifulHomesHappier Lives",
  );
  await expect(page.locator(".hero-image")).toBeVisible();
  expect(
    await page
      .locator(".hero-image")
      .evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
  ).toBeTruthy();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "About" })
      .click();
    await expect(page).toHaveURL(/#story$/);
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }),
    ).toHaveCount(0);
  } else {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Products" })
      .click();
    await expect(page).toHaveURL(/#collections$/);
  }
  await page
    .getByRole("group", { name: "Filter inspiration by room" })
    .getByRole("button", { name: "Bedroom", exact: true })
    .click();
  await expect(page.locator(".room-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "A little more serenity" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "All spaces" }).click();
  await expect(page.locator(".room-card")).toHaveCount(4);
  await expect(page.getByText("Moss Path", { exact: true })).toBeVisible();
  await expect(page.getByText("Desert Rose", { exact: true })).toBeVisible();
  await expect(page.getByText("Ivory Air", { exact: true })).toBeVisible();
  await expect(page.getByText("Elmora.", { exact: true })).toHaveCount(3);
  const collectionImagesLoaded = await page
    .locator(".swatch-photo")
    .evaluateAll((images: HTMLImageElement[]) =>
      images.every(
        (image) =>
          image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
      ),
    );
  expect(collectionImagesLoaded).toBe(true);
  const imageBoxes = await page.locator(".room-image").evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { width: Math.round(box.width), height: Math.round(box.height) };
    }),
  );
  if (testInfo.project.name === "desktop") {
    expect(new Set(imageBoxes.map(({ width }) => width)).size).toBe(1);
    expect(new Set(imageBoxes.map(({ height }) => height)).size).toBe(1);
  }
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-full.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("contact form validates and clearly reports preview only", async ({
  page,
}) => {
  await page.goto("/#contact");
  await page.getByRole("button", { name: "Preview enquiry" }).click();
  expect(
    await page
      .locator('input[name="name"]')
      .evaluate((input: HTMLInputElement) => input.validity.valueMissing),
  ).toBeTruthy();
  await page.getByLabel("Your name").fill("Preview Visitor");
  await page.getByLabel("Email address").fill("preview@example.com");
  await page.getByLabel("City").fill("Pune");
  await page
    .getByLabel("What are you imagining?")
    .fill("Sage tones for a living room.");
  await page.getByRole("button", { name: "Preview enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("Nothing has been sent");
});
