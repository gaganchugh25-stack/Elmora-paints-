import { test, expect, type Page } from "@playwright/test";
import { paintColours, recolourWall } from "../src/lib/paint-rendering";
const stage = (page: Page) => page.locator(".comparison-stage");
const slider = (page: Page) =>
  page.getByRole("slider", { name: "Before and after comparison" });
async function openStudio(page: Page) {
  await page.goto("/#visualiser");
  await expect(stage(page)).toHaveAttribute("data-ready", "true");
}
async function pixel(page: Page, x: number, y: number) {
  return page
    .locator(".comparison-painted")
    .evaluate(
      (canvas: HTMLCanvasElement, point) => [
        ...canvas.getContext("2d")!.getImageData(point.x, point.y, 1, 1).data,
      ],
      { x, y },
    );
}

test("paint math preserves unmasked pixels and relative wall illumination", () => {
  const source = new Uint8ClampedArray([
    210, 194, 179, 255, 105, 97, 90, 255, 21, 40, 70, 255,
  ]);
  const mask = new Uint8ClampedArray([
    255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255,
  ]);
  const result = recolourWall(source, mask, "#9ba58b", "living");
  expect([...result.slice(8)]).toEqual([...source.slice(8)]);
  expect([...result.slice(0, 3)]).toEqual([155, 165, 139]);
  expect(Math.abs(result[4] - result[0] / 2)).toBeLessThanOrEqual(0.5);
});

test("every room and swatch recolours the wall while preserving foreground", async ({
  page,
}) => {
  await openStudio(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const room of ["Living room", "Bedroom"]) {
    await page
      .getByRole("group", { name: "Choose a visualiser room" })
      .getByRole("button", { name: room, exact: true })
      .click();
    await expect(stage(page)).toHaveAttribute("data-ready", "true");
    const foreground = await pixel(page, 300, 600);
    const colours = new Set<string>();
    for (const colour of paintColours) {
      const button = page
        .getByRole("group", { name: "Choose a wall colour" })
        .getByRole("button", { name: colour.name, exact: true });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(stage(page)).toHaveAttribute("data-colour", colour.hex);
      await expect(page.locator(".selected-paint h4")).toHaveText(colour.name);
      colours.add(JSON.stringify(await pixel(page, 1072, 76)));
      expect(await pixel(page, 300, 600)).toEqual(foreground);
    }
    expect(colours.size).toBe(6);
    if (room === "Bedroom") {
      await page
        .getByRole("button", { name: "Linen white", exact: true })
        .click();
      await page
        .getByRole("button", { name: "View colour", exact: true })
        .click();
      await page
        .locator(".comparison-stage")
        .screenshot({
          path: `test-results/bedroom-wall-${test.info().project.name}.png`,
        });
    }
  }
  expect(errors).toEqual([]);
});

test("comparison buttons, keyboard, drag, reset and enquiry link work", async ({
  page,
}, info) => {
  await openStudio(page);
  await page.getByRole("button", { name: "View before", exact: true }).click();
  await expect(slider(page)).toHaveValue("100");
  await page.getByRole("button", { name: "View colour", exact: true }).click();
  await expect(slider(page)).toHaveValue("0");
  await slider(page).focus();
  await slider(page).press("End");
  await expect(slider(page)).toHaveValue("100");
  await slider(page).press("ArrowLeft");
  await expect(slider(page)).toHaveValue("99");
  await slider(page).press("Home");
  await expect(slider(page)).toHaveValue("0");
  const bounds = (await stage(page).boundingBox())!;
  if (info.project.name === "mobile") {
    const cdp = await page.context().newCDPSession(page);
    const y = bounds.y + bounds.height * 0.6;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: bounds.x + bounds.width * 0.2, y }],
    });
    for (let step = 1; step <= 6; step++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: bounds.x + bounds.width * (0.2 + (0.6 * step) / 6),
            y,
          },
        ],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
  } else {
    await page.mouse.move(
      bounds.x + bounds.width * 0.2,
      bounds.y + bounds.height * 0.6,
    );
    await page.mouse.down();
    await page.mouse.move(
      bounds.x + bounds.width * 0.8,
      bounds.y + bounds.height * 0.6,
      { steps: 10 },
    );
    await page.mouse.up();
  }
  await expect
    .poll(async () => Number(await slider(page).inputValue()))
    .toBeGreaterThan(75);
  await page.getByRole("button", { name: "Fired clay", exact: true }).click();
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await expect(slider(page)).toHaveValue("50");
  await expect(
    page.getByRole("button", { name: "Sage hush", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .locator(".studio-palette")
    .getByRole("link", { name: "Let’s talk colour" })
    .click();
  await expect(page).toHaveURL(/#contact$/);
});

test("room load failure can be retried without losing controls", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/visualiser/living-mask.png", (route) =>
    fail ? route.abort() : route.continue(),
  );
  await page.goto("/#visualiser");
  await expect(page.locator(".studio-error")).toContainText("could not load");
  await expect(slider(page)).toBeDisabled();
  fail = false;
  await page.getByRole("button", { name: "Retry preview" }).click();
  await expect(stage(page)).toHaveAttribute("data-ready", "true");
  await expect(slider(page)).toBeEnabled();
});

test("rapid room changes resolve to the selected room", async ({ page }) => {
  await openStudio(page);
  const room = page.getByRole("group", { name: "Choose a visualiser room" });
  await room.getByRole("button", { name: "Bedroom", exact: true }).click();
  await room.getByRole("button", { name: "Living room", exact: true }).click();
  await room.getByRole("button", { name: "Bedroom", exact: true }).click();
  await expect(stage(page)).toHaveAttribute("data-room", "bedroom");
  await expect(stage(page)).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".comparison-painted")).toHaveAttribute(
    "aria-label",
    /Bedroom/,
  );
});

test("reduced motion keeps the colour studio fully interactive and removes parallax", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openStudio(page);
  await page.getByRole("button", { name: "Mineral blue", exact: true }).click();
  await expect(stage(page)).toHaveAttribute("data-colour", "#8eabb2");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.locator(".story-image img")).toHaveCSS("transform", "none");
});

test("studio media budget, colour response and responsive layout", async ({
  page,
}, info) => {
  await openStudio(page);
  await page.getByRole("button", { name: "View colour", exact: true }).click();
  await page.getByRole("button", { name: "Fired clay", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator("#visualiser")
    .screenshot({ path: `preview/studio-${info.project.name}.png` });
  const timing = await page.evaluate(async () => {
    const times: number[] = [];
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      ".paint-swatch",
    )) {
      const start = performance.now();
      button.click();
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      times.push(performance.now() - start);
    }
    return {
      maxInteractionMs: Math.max(...times),
      media: performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.includes("/visualiser/"))
        .map((entry) => ({
          name: entry.name,
          bytes: (entry as PerformanceResourceTiming).encodedBodySize,
        })),
    };
  });
  expect(timing.maxInteractionMs).toBeLessThan(200);
  expect(timing.media.reduce((sum, item) => sum + item.bytes, 0)).toBeLessThan(
    900000,
  );
  console.log("STUDIO_PERFORMANCE", info.project.name, JSON.stringify(timing));
  if (info.project.name === "desktop") {
    for (const width of [320, 390, 768, 850, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});
