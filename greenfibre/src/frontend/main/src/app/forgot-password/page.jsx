import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata = {
  title: "Forgot Password",
  description:
    "Reset your GreenFibre account password — we'll send a reset code to your email.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
