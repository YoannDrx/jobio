import { Hr, Text } from "@react-email/components";

export const BilingualDivider = () => (
  <>
    <Hr style={{ margin: "32px 0", borderColor: "#e2e8f0" }} />
    <Text
      style={{
        fontSize: "11px",
        color: "#94a3b8",
        textTransform: "uppercase" as const,
        letterSpacing: "1px",
        marginBottom: "16px",
      }}
    >
      ENGLISH VERSION
    </Text>
  </>
);
