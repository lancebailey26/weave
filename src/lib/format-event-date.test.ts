import { formatEventDate } from "./format-event-date";
import type { Event } from "./types";

const baseEvent: Event = {
  id: "evt-1",
  title: "Test",
  description: "Test event",
  date: "2020-01-15",
  category: "world",
  createdAt: "2020-01-15T00:00:00Z",
  submittedBy: "seed",
};

describe("formatEventDate", () => {
  it("formats day precision by default", () => {
    expect(formatEventDate(baseEvent)).toBe("January 15, 2020");
  });

  it("formats month precision", () => {
    expect(formatEventDate({ ...baseEvent, precision: "month" })).toBe("January 2020");
  });

  it("formats year precision", () => {
    expect(formatEventDate({ ...baseEvent, precision: "year" })).toBe("2020");
  });

  it("returns original date when invalid", () => {
    expect(formatEventDate({ ...baseEvent, date: "not-a-date" })).toBe("not-a-date");
  });
});
