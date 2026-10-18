import { test, expect, type Page } from "@playwright/test";

const hero = (page: Page) => page.locator("#walkthrough");
const journey = (page: Page) => page.locator(".walkthrough-video");

async function ready(page: Page) {
  await page.goto("/");
  await expect(hero(page)).toHaveAttribute("data-walkthrough", "active", {
    timeout: 20000,
  });
  await expect
    .poll(() =>
      journey(page).evaluate((media) => (media as HTMLVideoElement).duration),
    )
    .toBeCloseTo(40, 1);
}

async function scrollToProgress(page: Page, progress: number) {
  await page.evaluate(
    (value) =>
      window.scrollTo({
        top: Math.max(5600, innerHeight * 7) * value,
        behavior: "instant",
      }),
    progress,
  );
  await expect
    .poll(async () => Number(await hero(page).getAttribute("data-progress")), {
      timeout: 5000,
    })
    .toBeCloseTo(progress, 2);
  await expect
    .poll(async () => Number(await hero(page).getAttribute("data-video-time")))
    .toBeCloseTo(Math.min(40 - 1 / 24, progress * 40), 1);
}

test("desktop journey is pinned, deterministic and reversible", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop");
  await ready(page);
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  for (let scene = 0; scene < 6; scene++) {
    const progress = (scene * 6 + 3) / 40;
    await scrollToProgress(page, progress);
    await expect(hero(page)).toHaveAttribute("data-scene", String(scene));
  }
  await scrollToProgress(page, 0.2);
  const firstTime = Number(await hero(page).getAttribute("data-video-time"));
  await scrollToProgress(page, 0.7);
  await scrollToProgress(page, 0.2);
  expect(Number(await hero(page).getAttribute("data-video-time"))).toBeCloseTo(
    firstTime,
    1,
  );
  expect(
    await hero(page).evaluate((element) =>
      Math.abs(element.getBoundingClientRect().top - 94),
    ),
  ).toBeLessThan(3);
});

test("video seeking stays responsive during forward and reverse scrolling", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop");
  await ready(page);
  const result = await page.evaluate(async () => {
    const intervals: number[] = [];
    const longTasks: number[] = [];
    const presentedTimes: number[] = [];
    const media =
      document.querySelector<HTMLVideoElement>(".walkthrough-video")!;
    let observeFrames = true;
    const observePresentedFrame: VideoFrameRequestCallback = (_, metadata) => {
      if (!observeFrames) return;
      if (
        presentedTimes.length === 0 ||
        Math.abs(metadata.mediaTime - presentedTimes.at(-1)!) > 1 / 48
      )
        presentedTimes.push(metadata.mediaTime);
      media.requestVideoFrameCallback(observePresentedFrame);
    };
    media.requestVideoFrameCallback(observePresentedFrame);
    const observer = new PerformanceObserver((list) =>
      list.getEntries().forEach((entry) => longTasks.push(entry.duration)),
    );
    observer.observe({ type: "longtask", buffered: false });
    let last = performance.now();
    const start = last;
    let distinctTimes = 0;
    let previous = -1;
    await new Promise<void>((resolve) => {
      function tick(now: number) {
        intervals.push(now - last);
        last = now;
        const phase = Math.min(1, (now - start) / 5000);
        const progress =
          phase < 0.65 ? phase / 0.65 : 1 - (phase - 0.65) / 0.35;
        window.scrollTo({
          top: Math.max(5600, innerHeight * 7) * progress,
          behavior: "instant",
        });
        if (Math.abs(media.currentTime - previous) > 1 / 48) distinctTimes++;
        previous = media.currentTime;
        if (phase < 1) requestAnimationFrame(tick);
        else resolve();
      }
      requestAnimationFrame(tick);
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    observeFrames = false;
    observer.disconnect();
    intervals.sort((a, b) => a - b);
    return {
      distinctTimes,
      presentedFrames: presentedTimes.length,
      p95: intervals[Math.floor(intervals.length * 0.95)],
      longTasks: longTasks.length,
      longestTask: Math.max(0, ...longTasks),
    };
  });
  console.log("VIDEO_WALKTHROUGH_PERFORMANCE", JSON.stringify(result));
  expect(result.distinctTimes).toBeGreaterThan(100);
  // The source is 24 fps; require at least 20 distinct presented frames per second.
  expect(result.presentedFrames).toBeGreaterThan(100);
  expect(result.p95).toBeLessThan(50);
  expect(result.longestTask).toBeLessThan(100);
});

test("rapid direction changes settle on the latest requested frame", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop");
  await ready(page);
  for (const progress of [0.18, 0.72, 0.31, 0.84, 0.24, 0.56]) {
    await page.evaluate(
      (value) => window.scrollTo(0, Math.max(5600, innerHeight * 7) * value),
      progress,
    );
    await page.waitForTimeout(55);
  }
  await expect
    .poll(
      () =>
        journey(page).evaluate(
          (media) => (media as HTMLVideoElement).currentTime,
        ),
      {
        timeout: 3000,
      },
    )
    .toBeCloseTo(0.56 * 40, 0);
  await expect
    .poll(() =>
      journey(page).evaluate((media) => (media as HTMLVideoElement).seeking),
    )
    .toBe(false);
});

test("static fallbacks avoid journey media", async ({ page }, info) => {
  if (info.project.name === "desktop")
    await page.emulateMedia({ reducedMotion: "reduce" });
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("elmora-journey-sharp.mp4"))
      requests.push(request.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(hero(page)).toHaveAttribute("data-walkthrough", "static");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  expect(requests).toEqual([]);
  await expect(page.locator(".hero-image")).toBeVisible();
});

test("media failure returns to the static hero", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await page.route("**/elmora-journey-sharp.mp4**", (route) => route.abort());
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(hero(page)).toHaveAttribute("data-walkthrough", "static");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.locator(".hero-image")).toBeVisible();
});

test("Save-Data avoids the journey video", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", {
      value: Object.assign(new EventTarget(), {
        saveData: true,
        effectiveType: "4g",
      }),
    });
  });
  await page.goto("/");
  await expect(hero(page)).toHaveAttribute("data-walkthrough", "static");
  await expect(journey(page)).not.toHaveAttribute("src");
});

test("Skip walkthrough releases the pin and preserves keyboard flow", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop");
  await ready(page);
  const skip = page.getByRole("button", { name: "Skip walkthrough" });
  await skip.focus();
  await skip.press("Enter");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(hero(page)).toHaveAttribute("data-walkthrough", "static");
  await expect(page.locator("#collections")).toBeFocused();
});

test("section links and Back to top work around the pin", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop");
  await ready(page);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "About" })
    .click();
  await expect(page).toHaveURL(/#story$/);
  await expect
    .poll(() =>
      page
        .locator("#story")
        .evaluate((element) =>
          Math.abs(element.getBoundingClientRect().top - 100),
        ),
    )
    .toBeLessThan(4);
  await page.getByRole("link", { name: "Back to top", exact: true }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(4);
});

test("resizing to mobile releases the pin without overflow", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop");
  await ready(page);
  await scrollToProgress(page, 0.2);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(hero(page)).toHaveAttribute("data-walkthrough", "static");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
