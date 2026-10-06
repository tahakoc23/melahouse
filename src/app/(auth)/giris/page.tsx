import { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "MELA HOUSE hesabınıza giriş yapın.",
};

export default function LoginPage() {
  return <LoginForm />;
}
