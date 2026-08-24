import { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap | Veloria",
  description: "Veloria hesabınıza giriş yapın.",
};

export default function LoginPage() {
  return <LoginForm />;
}
