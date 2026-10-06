import { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "MELA HOUSE'ya kayıt olun.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
