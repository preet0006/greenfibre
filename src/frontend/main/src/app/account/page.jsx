import AccountClient from "./AccountClient";

export const metadata = {
  title: "My Account",
  description:
    "Manage your Greenfibre profile, addresses, password and account settings.",
};

export default function AccountPage() {
  return <AccountClient />;
}
