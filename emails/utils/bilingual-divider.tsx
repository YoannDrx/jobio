import { Hr, Text } from "@react-email/components";

export const BilingualDivider = () => (
  <>
    <Hr style={{ margin: "40px 0 24px", borderColor: "#e2e8f0" }} />
    <Text
      style={{
        fontSize: "11px",
        color: "#94a3b8",
        textTransform: "uppercase" as const,
        letterSpacing: "2px",
        textAlign: "center" as const,
        marginBottom: "24px",
      }}
    >
      — ENGLISH VERSION —
    </Text>
  </>
);
