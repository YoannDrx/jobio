import { describe, expect, it } from "vitest";
import {
  formatFecAmount,
  formatFecDate,
  generateFecEntries,
  generateFecFile,
} from "@/features/freelance/billing-fec-export";

describe("billing-fec-export", () => {
  describe("formatFecDate", () => {
    it("formats date to YYYYMMDD", () => {
      const date = new Date("2026-02-24");
      expect(formatFecDate(date)).toBe("20260224");
    });

    it("handles single digit months and days with padding", () => {
      const date = new Date("2026-01-05");
      expect(formatFecDate(date)).toBe("20260105");
    });

    it("handles December dates", () => {
      const date = new Date("2025-12-31");
      expect(formatFecDate(date)).toBe("20251231");
    });
  });

  describe("formatFecAmount", () => {
    it("formats 0 cents to 0,00", () => {
      expect(formatFecAmount(0)).toBe("0,00");
    });

    it("formats 10000 cents to 100,00", () => {
      expect(formatFecAmount(10000)).toBe("100,00");
    });

    it("formats 123456 cents to 1234,56", () => {
      expect(formatFecAmount(123456)).toBe("1234,56");
    });

    it("formats small amounts with leading zeros", () => {
      expect(formatFecAmount(50)).toBe("0,50");
    });

    it("formats single cents", () => {
      expect(formatFecAmount(1)).toBe("0,01");
    });

    it("uses comma as decimal separator", () => {
      const result = formatFecAmount(123456);
      expect(result).toContain(",");
      expect(result).not.toContain(".");
    });
  });

  describe("generateFecEntries", () => {
    const mockDate = new Date("2026-02-24");
    const mockClient = { displayName: "Test Client" };

    it("generates invoice entries for ISSUED status", () => {
      const entries = generateFecEntries({
        invoices: [
          {
            number: "INV-001",
            issueDate: mockDate,
            status: "ISSUED",
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
            client: mockClient,
          },
        ],
        payments: [],
        creditNotes: [],
      });

      expect(entries).toHaveLength(3); // 1 client debit + 1 revenue credit + 1 tax credit
      expect(entries[0].compteNum).toBe("411000"); // Clients debit
      expect(entries[0].debit).toBe("1200,00");
      expect(entries[0].credit).toBe("0,00");

      expect(entries[1].compteNum).toBe("706000"); // Prestations credit
      expect(entries[1].debit).toBe("0,00");
      expect(entries[1].credit).toBe("1000,00");

      expect(entries[2].compteNum).toBe("445710"); // TVA credit
      expect(entries[2].debit).toBe("0,00");
      expect(entries[2].credit).toBe("200,00");
    });

    it("generates invoice entries for PAID status", () => {
      const entries = generateFecEntries({
        invoices: [
          {
            number: "INV-002",
            issueDate: mockDate,
            status: "PAID",
            subtotalCents: 50000,
            taxCents: 10000,
            totalCents: 60000,
            client: mockClient,
          },
        ],
        payments: [],
        creditNotes: [],
      });

      expect(entries).toHaveLength(3);
      expect(entries[0].debit).toBe("600,00");
    });

    it("generates invoice entries for PARTIALLY_PAID status", () => {
      const entries = generateFecEntries({
        invoices: [
          {
            number: "INV-003",
            issueDate: mockDate,
            status: "PARTIALLY_PAID",
            subtotalCents: 50000,
            taxCents: 10000,
            totalCents: 60000,
            client: mockClient,
          },
        ],
        payments: [],
        creditNotes: [],
      });

      expect(entries).toHaveLength(3);
    });

    it("skips invoices with other statuses", () => {
      const entries = generateFecEntries({
        invoices: [
          {
            number: "INV-DRAFT",
            issueDate: mockDate,
            status: "DRAFT",
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
            client: mockClient,
          },
        ],
        payments: [],
        creditNotes: [],
      });

      expect(entries).toHaveLength(0);
    });

    it("omits tax entry if taxCents is 0", () => {
      const entries = generateFecEntries({
        invoices: [
          {
            number: "INV-004",
            issueDate: mockDate,
            status: "ISSUED",
            subtotalCents: 100000,
            taxCents: 0,
            totalCents: 100000,
            client: mockClient,
          },
        ],
        payments: [],
        creditNotes: [],
      });

      expect(entries).toHaveLength(2); // Only client + revenue
      expect(entries.some((e) => e.compteNum === "445710")).toBe(false);
    });

    it("generates payment entries for CONFIRMED status", () => {
      const entries = generateFecEntries({
        invoices: [],
        payments: [
          {
            id: "pay-001",
            paidAt: mockDate,
            amountCents: 120000,
            method: "BANK_TRANSFER",
            status: "CONFIRMED",
            reference: "REF-123",
            client: mockClient,
            allocations: [{ invoice: { number: "INV-001" } }],
          },
        ],
        creditNotes: [],
      });

      expect(entries).toHaveLength(2); // 1 bank debit + 1 client credit
      expect(entries[0].compteNum).toBe("512000"); // Banque debit
      expect(entries[0].debit).toBe("1200,00");
      expect(entries[0].credit).toBe("0,00");

      expect(entries[1].compteNum).toBe("411000"); // Clients credit
      expect(entries[1].debit).toBe("0,00");
      expect(entries[1].credit).toBe("1200,00");
    });

    it("skips payments with other statuses", () => {
      const entries = generateFecEntries({
        invoices: [],
        payments: [
          {
            id: "pay-002",
            paidAt: mockDate,
            amountCents: 120000,
            method: "BANK_TRANSFER",
            status: "PENDING",
            reference: "REF-456",
            client: mockClient,
            allocations: [],
          },
        ],
        creditNotes: [],
      });

      expect(entries).toHaveLength(0);
    });

    it("generates credit note entries for ISSUED status", () => {
      const entries = generateFecEntries({
        invoices: [],
        payments: [],
        creditNotes: [
          {
            number: "CN-001",
            issueDate: mockDate,
            status: "ISSUED",
            subtotalCents: 50000,
            taxCents: 10000,
            totalCents: 60000,
            invoice: {
              number: "INV-001",
              client: mockClient,
            },
          },
        ],
      });

      expect(entries).toHaveLength(3); // 1 rabais debit + 1 tax debit + 1 client credit
      expect(entries[0].compteNum).toBe("709000"); // Rabais debit
      expect(entries[0].debit).toBe("500,00");
      expect(entries[0].credit).toBe("0,00");

      expect(entries[1].compteNum).toBe("445710"); // TVA debit
      expect(entries[1].debit).toBe("100,00");
      expect(entries[1].credit).toBe("0,00");

      expect(entries[2].compteNum).toBe("411000"); // Clients credit
      expect(entries[2].debit).toBe("0,00");
      expect(entries[2].credit).toBe("600,00");
    });

    it("generates credit note entries for APPLIED status", () => {
      const entries = generateFecEntries({
        invoices: [],
        payments: [],
        creditNotes: [
          {
            number: "CN-002",
            issueDate: mockDate,
            status: "APPLIED",
            subtotalCents: 50000,
            taxCents: 10000,
            totalCents: 60000,
            invoice: {
              number: "INV-001",
              client: mockClient,
            },
          },
        ],
      });

      expect(entries).toHaveLength(3);
    });

    it("omits tax entry in credit notes if taxCents is 0", () => {
      const entries = generateFecEntries({
        invoices: [],
        payments: [],
        creditNotes: [
          {
            number: "CN-003",
            issueDate: mockDate,
            status: "ISSUED",
            subtotalCents: 50000,
            taxCents: 0,
            totalCents: 50000,
            invoice: {
              number: "INV-001",
              client: mockClient,
            },
          },
        ],
      });

      expect(entries).toHaveLength(2); // Only rabais + client
      expect(entries.some((e) => e.compteNum === "445710")).toBe(false);
    });

    it("generates sequential entry numbers per journal", () => {
      const entries = generateFecEntries({
        invoices: [
          {
            number: "INV-001",
            issueDate: mockDate,
            status: "ISSUED",
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
            client: mockClient,
          },
          {
            number: "INV-002",
            issueDate: mockDate,
            status: "ISSUED",
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
            client: mockClient,
          },
        ],
        payments: [
          {
            id: "pay-001",
            paidAt: mockDate,
            amountCents: 120000,
            method: "BANK_TRANSFER",
            status: "CONFIRMED",
            reference: "REF-001",
            client: mockClient,
            allocations: [],
          },
        ],
        creditNotes: [],
      });

      const veEntries = entries.filter((e) => e.journalCode === "VE");
      const bqEntries = entries.filter((e) => e.journalCode === "BQ");

      expect(veEntries[0].ecritureNum).toBe("VE-001");
      expect(veEntries[3].ecritureNum).toBe("VE-002");
      expect(bqEntries[0].ecritureNum).toBe("BQ-001");
    });

    it("sorts entries by date then by entry number", () => {
      const date1 = new Date("2026-01-01");
      const date2 = new Date("2026-02-01");

      const entries = generateFecEntries({
        invoices: [
          {
            number: "INV-001",
            issueDate: date2,
            status: "ISSUED",
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
            client: mockClient,
          },
          {
            number: "INV-002",
            issueDate: date1,
            status: "ISSUED",
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
            client: mockClient,
          },
        ],
        payments: [],
        creditNotes: [],
      });

      const firstDate = entries[0].ecritureDate;
      const lastDate = entries[entries.length - 1].ecritureDate;

      expect(firstDate).toBe("20260101");
      expect(lastDate).toBe("20260201");
    });

    it("balances entries (total debit = total credit)", () => {
      const entries = generateFecEntries({
        invoices: [
          {
            number: "INV-001",
            issueDate: mockDate,
            status: "ISSUED",
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
            client: mockClient,
          },
        ],
        payments: [
          {
            id: "pay-001",
            paidAt: mockDate,
            amountCents: 120000,
            method: "BANK_TRANSFER",
            status: "CONFIRMED",
            reference: "REF-001",
            client: mockClient,
            allocations: [],
          },
        ],
        creditNotes: [],
      });

      let totalDebit = 0;
      let totalCredit = 0;

      for (const entry of entries) {
        totalDebit += parseFloat(entry.debit.replace(",", "."));
        totalCredit += parseFloat(entry.credit.replace(",", "."));
      }

      expect(totalDebit).toBeCloseTo(totalCredit, 2);
    });
  });

  describe("generateFecFile", () => {
    const mockDate = new Date("2026-02-24");
    const mockClient = { displayName: "Test Client" };

    it("generates file with header", () => {
      const entries = generateFecEntries({
        invoices: [
          {
            number: "INV-001",
            issueDate: mockDate,
            status: "ISSUED",
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
            client: mockClient,
          },
        ],
        payments: [],
        creditNotes: [],
      });

      const file = generateFecFile(entries);
      const lines = file.split("\n");

      expect(lines[0]).toContain("JournalCode");
      expect(lines[0]).toContain("JournalLib");
      expect(lines[0]).toContain("EcritureNum");
    });

    it("contains 18 columns in header", () => {
      const entries = generateFecEntries({
        invoices: [],
        payments: [],
        creditNotes: [],
      });

      const file = generateFecFile(entries);
      const headerLine = file.split("\n")[0];
      const columns = headerLine.split("\t");

      expect(columns).toHaveLength(18);
    });

    it("uses tab separator between columns", () => {
      const entries = generateFecEntries({
        invoices: [
          {
            number: "INV-001",
            issueDate: mockDate,
            status: "ISSUED",
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
            client: mockClient,
          },
        ],
        payments: [],
        creditNotes: [],
      });

      const file = generateFecFile(entries);
      const lines = file.split("\n");

      // Skip first line (header) and check data lines
      for (let i = 1; i < lines.length && lines[i].length > 0; i++) {
        const columns = lines[i].split("\t");
        expect(columns.length).toBeGreaterThanOrEqual(18);
      }
    });

    it("includes UTF-8 BOM", () => {
      const entries = generateFecEntries({
        invoices: [],
        payments: [],
        creditNotes: [],
      });

      const file = generateFecFile(entries);
      expect(file.charCodeAt(0)).toBe(0xfeff);
    });

    it("includes all entry data in output", () => {
      const entries = generateFecEntries({
        invoices: [
          {
            number: "INV-001",
            issueDate: mockDate,
            status: "ISSUED",
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
            client: mockClient,
          },
        ],
        payments: [],
        creditNotes: [],
      });

      const file = generateFecFile(entries);

      expect(file).toContain("VE");
      expect(file).toContain("INV-001");
      expect(file).toContain("1200,00");
      expect(file).toContain("706000");
    });

    it("generates file with correct structure", () => {
      const entries = generateFecEntries({
        invoices: [
          {
            number: "INV-001",
            issueDate: mockDate,
            status: "ISSUED",
            subtotalCents: 100000,
            taxCents: 20000,
            totalCents: 120000,
            client: mockClient,
          },
        ],
        payments: [
          {
            id: "pay-001",
            paidAt: mockDate,
            amountCents: 120000,
            method: "BANK_TRANSFER",
            status: "CONFIRMED",
            reference: "REF-001",
            client: mockClient,
            allocations: [],
          },
        ],
        creditNotes: [],
      });

      const file = generateFecFile(entries);
      const lines = file.split("\n").filter((l) => l.length > 0);

      // BOM + header + 5 entries (3 invoice + 2 payment)
      expect(lines).toHaveLength(6);
    });
  });
});
