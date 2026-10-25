import { describe, it, expect } from "vitest";
import { paymentAmountMatches } from "@/lib/kkiapay/amount";

describe("paymentAmountMatches", () => {
  it("accepte les montants identiques (number ou string)", () => {
    expect(paymentAmountMatches(5000, 5000)).toBe(true);
    expect(paymentAmountMatches(5000, "5000")).toBe(true);
    expect(paymentAmountMatches(5000, 5000.0)).toBe(true);
  });

  it("tolère une légère différence numérique", () => {
    expect(paymentAmountMatches(5000, 5000.4)).toBe(true);
  });

  it("ignore si le montant KKiaPay est absent", () => {
    expect(paymentAmountMatches(5000, undefined)).toBe(true);
    expect(paymentAmountMatches(5000, null)).toBe(true);
  });

  it("rejette un écart significatif", () => {
    expect(paymentAmountMatches(5000, 5100)).toBe(false);
  });
});
